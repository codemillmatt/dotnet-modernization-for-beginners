using System.Text.Json;
using BookCatalog.Data;
using Microsoft.Data.SqlClient;

namespace BookCatalog.Data.Tests;

public sealed class LocalDbFactAttribute : FactAttribute
{
    public LocalDbFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("BOOKCATALOG_TRANSFER_TEST_INSTANCE") is null)
            Skip = "Run scripts\\Test-DataTransfer.ps1 to create a dedicated per-run LocalDB instance.";
    }
}

public class LocalDbIntegrationTests
{
    [LocalDbFact]
    public async Task RealSqlServerExportPreviewApplyVerifyIdempotencyGuardsAndRollback()
    {
        var instance = Environment.GetEnvironmentVariable("BOOKCATALOG_TRANSFER_TEST_INSTANCE")!;
        var directory = Environment.GetEnvironmentVariable("BOOKCATALOG_TRANSFER_TEST_DIRECTORY")!;
        Assert.Matches("^BookCatalogTransfer_[0-9a-f]{32}$", instance);
        var runId = instance["BookCatalogTransfer_".Length..];
        var expectedDirectory = Path.GetFullPath(Path.Combine(FindRepository(), ".bookcatalog-lab", $"integration-{runId}"));
        Assert.Equal(expectedDirectory, Path.GetFullPath(directory), ignoreCase: true);
        Assert.Equal(instance, File.ReadAllText(Path.Combine(directory, ".owned-instance")));
        var masterConfig = new SqlConnectionStringBuilder
        {
            DataSource = $"(localdb)\\{instance}", InitialCatalog = "master",
            IntegratedSecurity = true, Encrypt = false, Pooling = false, ConnectRetryCount = 0
        };
        var appData = Path.Combine(directory, "legacy", "App_Data");
        Directory.CreateDirectory(appData);
        var sourceFile = Path.Combine(appData, "BookCatalog.mdf");
        const string sourceDatabase = "BookCatalogTransferSource";
        const string destinationDatabase = Configuration.LocalDatabase;
        await using var master = new SqlConnection(masterConfig.ConnectionString);
        await master.OpenAsync();
        var created = new List<string>();
        try
        {
            await CreateDatabaseAsync(master, sourceDatabase, sourceFile);
            created.Add(sourceDatabase);
            await CreateDatabaseAsync(master, destinationDatabase, Path.Combine(directory, "destination.mdf"));
            created.Add(destinationDatabase);
            var sourceConfig = new SqlConnectionStringBuilder(masterConfig.ConnectionString) { InitialCatalog = sourceDatabase };
            var targetConfig = new SqlConnectionStringBuilder(masterConfig.ConnectionString) { InitialCatalog = destinationDatabase };
            await using (var source = new SqlConnection(sourceConfig.ConnectionString))
            {
                await source.OpenAsync();
                await SqlAsync(source, Schema("datetime"));
                await SqlAsync(source, """
                    SET IDENTITY_INSERT dbo.Books ON;
                    INSERT dbo.Books (Id, Title, Author, ISBN, PublishedYear, IsActive, CreatedDate) VALUES
                    (8, N'  雪 & books  ', N'O''Brien', NULL, NULL, 0, '2021-03-04T05:06:07.003'),
                    (9, N'Keep trailing spaces  ', N'Learner', N'', 2020, 1, '2021-03-04T05:06:07.997'),
                    (10, N'Active and complete', N'Learner', N'1234567890123', 1999, 1, '2021-03-04T05:06:07.007');
                    SET IDENTITY_INSERT dbo.Books OFF;
                    """);
            }
            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                await SqlAsync(target, Schema("datetime2(7)"));
                await SqlAsync(target, """
                    INSERT dbo.Books (Title, Author, ISBN, PublishedYear, IsActive, CreatedDate)
                    SELECT CONCAT(N'Seed ', v.Id), N'Seed author', NULL, NULL, 1, '2000-01-01'
                    FROM (VALUES (1), (2), (3), (4), (5), (6), (7)) AS v(Id);
                    """);
            }

            var webConfig = Path.Combine(directory, "legacy", "Web.config");
            var configText = $"""
                <configuration><connectionStrings>
                <add name="BookCatalogContext" connectionString="Data Source=(LocalDB)\{instance};AttachDbFilename=|DataDirectory|\BookCatalog.mdf;Integrated Security=True" providerName="System.Data.SqlClient" />
                </connectionStrings></configuration>
                """;
            await File.WriteAllTextAsync(webConfig, configText);
            var targetPath = Path.Combine(directory, "appsettings.json");
            await WriteConfigurationAsync(targetPath, targetConfig.ConnectionString);
            var snapshotPath = Path.Combine(directory, "books.json");
            var export = new[] { "export", "--source-config", webConfig, "--ids", "10,8,9", "--output", snapshotPath };
            var result = await RunAsync(export);
            Assert.Equal(0, result.Code);
            var snapshotBytes = await File.ReadAllBytesAsync(snapshotPath);
            var snapshot = SnapshotFile.Parse(await File.ReadAllTextAsync(snapshotPath));
            Assert.Equal("datetime", snapshot.CreatedDateStorage.Type);
            Assert.Equal([8, 9, 10], snapshot.Books.Select(b => b.Id));
            Assert.Equal(3, snapshot.Books[0].CreatedDate.Millisecond);
            Assert.Equal("  雪 & books  ", snapshot.Books[0].Title);
            Assert.Null(snapshot.Books[0].ISBN);
            Assert.Null(snapshot.Books[0].PublishedYear);
            Assert.False(snapshot.Books[0].IsActive);
            Assert.Equal("", snapshot.Books[1].ISBN);
            Assert.Equal(0, (await RunAsync([.. export[..^1], Path.Combine(directory, "again.json")])).Code);
            Assert.Equal(snapshotBytes, await File.ReadAllBytesAsync(Path.Combine(directory, "again.json")));
            Assert.Equal(1, (await RunAsync(export)).Code);
            var missingPath = Path.Combine(directory, "missing.json");
            Assert.Equal(1, (await RunAsync(["export", "--source-config", webConfig, "--ids", "8,999", "--output", missingPath])).Code);
            Assert.False(File.Exists(missingPath));
            var unattachedConfig = Path.Combine(directory, "legacy", "unattached.config");
            await File.WriteAllTextAsync(unattachedConfig, configText.Replace("BookCatalog.mdf", "Unattached.mdf"));
            result = await RunAsync(["export", "--source-config", unattachedConfig, "--ids", "8", "--output", missingPath]);
            Assert.Equal(1, result.Code);
            Assert.Contains("not already attached", result.Error);
            Assert.False(File.Exists(Path.Combine(appData, "Unattached.mdf")));
            Assert.False(File.Exists(missingPath));

            var import = new[] { "import", "--input", snapshotPath, "--target-config", targetPath };
            result = await RunAsync(import);
            Assert.Equal(0, result.Code);
            Assert.Contains("PREVIEW ONLY: 3 would be inserted", result.Output);
            Assert.Equal(7, await CountAsync(targetConfig));
            Assert.Equal(1, (await RunAsync(["verify", .. import[1..]])).Code);
            result = await RunAsync([.. import, "--apply"]);
            Assert.Equal(0, result.Code);
            Assert.Contains("3 inserted", result.Output);
            Assert.Equal(10, await CountAsync(targetConfig));
            Assert.Equal(0, (await RunAsync(["verify", .. import[1..]])).Code);
            result = await RunAsync([.. import, "--apply"]);
            Assert.Equal(0, result.Code);
            Assert.Contains("0 inserted; 3 already matched", result.Output);
            Assert.Equal(10, await CountAsync(targetConfig));

            var conflictPath = Path.Combine(directory, "conflict.json");
            await SnapshotFile.WriteNewAsync(conflictPath, snapshot with
            {
                Books = [snapshot.Books[0] with { Author = "CONFLICT" }, snapshot.Books[1] with { Id = 100 }]
            });
            result = await RunAsync(["import", "--input", conflictPath, "--target-config", targetPath, "--apply"]);
            Assert.Equal(1, result.Code);
            Assert.Contains("ID 8: differs in Author", result.Output);
            Assert.Equal(10, await CountAsync(targetConfig));

            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                await SqlAsync(target, "ALTER TABLE dbo.Books ADD CONSTRAINT CK_IntegrationFailure CHECK (Title <> N'reject');");
            }
            var rollbackPath = Path.Combine(directory, "rollback.json");
            await SnapshotFile.WriteNewAsync(rollbackPath, snapshot with
            {
                Books = [snapshot.Books[0] with { Id = 100 }, snapshot.Books[1] with { Id = 101, Title = "reject" }]
            });
            result = await RunAsync(["import", "--input", rollbackPath, "--target-config", targetPath, "--apply"]);
            Assert.Equal(1, result.Code);
            Assert.Contains("error 547", result.Error);
            Assert.Equal(10, await CountAsync(targetConfig));
            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                Assert.Empty(await SqlBookStore.ReadAsync(target, [100, 101]));
                await SqlAsync(target, "ALTER TABLE dbo.Books ADD Unexpected int NULL;");
            }
            Assert.Equal(1, (await RunAsync(import)).Code);
            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                await SqlAsync(target, "ALTER TABLE dbo.Books DROP COLUMN Unexpected;");
                await SqlAsync(target, "CREATE TRIGGER dbo.Unreviewed ON dbo.Books AFTER INSERT AS PRINT 'not approved';");
            }
            result = await RunAsync(import);
            Assert.Equal(1, result.Code);
            Assert.Contains("trigger", result.Error);
            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                await SqlAsync(target, "DROP TRIGGER dbo.Unreviewed;");
                await SqlAsync(target, "ALTER TABLE dbo.Books ALTER COLUMN CreatedDate datetime2(3) NOT NULL;");
            }
            Assert.Equal(1, (await RunAsync(import)).Code);
            await using (var target = new SqlConnection(targetConfig.ConnectionString))
            {
                await target.OpenAsync();
                await SqlAsync(target, "ALTER TABLE dbo.Books ALTER COLUMN CreatedDate datetime2(7) NOT NULL;");
            }

            var wrongPath = Path.Combine(directory, "wrong-target.json");
            await WriteConfigurationAsync(wrongPath, sourceConfig.ConnectionString);
            result = await RunAsync(["import", "--input", snapshotPath, "--target-config", wrongPath, "--apply"]);
            Assert.Equal(1, result.Code);
            var targetSourcePath = Path.Combine(directory, "target-as-source.json");
            Assert.Equal(0, (await RunAsync(["export", "--source-config", targetPath, "--ids", "8", "--output", targetSourcePath])).Code);
            result = await RunAsync(["import", "--input", targetSourcePath, "--target-config", targetPath, "--apply"]);
            Assert.Equal(1, result.Code);
            Assert.Contains("same database", result.Error);

            await using (var source = new SqlConnection(sourceConfig.ConnectionString))
            {
                await source.OpenAsync();
                Assert.Equal(snapshot.Books, await SqlBookStore.ReadAsync(source, [8, 9, 10]));
                await SqlAsync(source, """
                    ALTER TABLE dbo.Books ALTER COLUMN CreatedDate datetime2(7) NOT NULL;
                    INSERT dbo.Books (Title, Author, ISBN, PublishedYear, IsActive, CreatedDate)
                    VALUES (N'Full timestamp precision', N'Learner', NULL, NULL, 1, '2022-05-06T07:08:09.1234567');
                    """);
            }
            var modernSourcePath = Path.Combine(directory, "modern-source.json");
            await WriteConfigurationAsync(modernSourcePath, sourceConfig.ConnectionString);
            var precisionPath = Path.Combine(directory, "precision.json");
            Assert.Equal(0, (await RunAsync(["export", "--source-config", modernSourcePath, "--ids", "11", "--output", precisionPath])).Code);
            var precision = SnapshotFile.Parse(await File.ReadAllTextAsync(precisionPath));
            Assert.Equal(1234567, precision.Books[0].CreatedDate.Ticks % TimeSpan.TicksPerSecond);
            Assert.Equal(0, (await RunAsync(["import", "--input", precisionPath, "--target-config", targetPath, "--apply"])).Code);
            Assert.Equal(0, (await RunAsync(["verify", "--input", precisionPath, "--target-config", targetPath])).Code);
            Assert.Equal(11, await CountAsync(targetConfig));
            Assert.Equal(snapshotBytes, await File.ReadAllBytesAsync(snapshotPath));
            Assert.Equal(configText, await File.ReadAllTextAsync(webConfig));
            var invalidEncodingPath = Path.Combine(directory, "invalid-utf8.json");
            await File.WriteAllBytesAsync(invalidEncodingPath, [0xff, 0xfe, 0xfd]);
            result = await RunAsync(["import", "--input", invalidEncodingPath, "--target-config", targetPath, "--apply"]);
            Assert.Equal(1, result.Code);
            Assert.Contains("UTF-8", result.Error);
            Assert.Equal(11, await CountAsync(targetConfig));
        }
        finally
        {
            foreach (var database in created.AsEnumerable().Reverse())
                await SqlAsync(master, $"ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{database}];");
        }
    }

    private static string FindRepository()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "scripts", "Test-DataTransfer.ps1")))
            directory = directory.Parent;
        return directory?.FullName ?? throw new InvalidOperationException("Cannot locate the repository.");
    }

    private static string Schema(string timestamp) => $$"""
        CREATE TABLE dbo.Books (
            Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Books PRIMARY KEY,
            Title nvarchar(200) NOT NULL,
            Author nvarchar(100) NOT NULL,
            ISBN nvarchar(13) NULL,
            PublishedYear int NULL,
            IsActive bit NOT NULL,
            CreatedDate {{timestamp}} NOT NULL
        );
        """;

    private static async Task CreateDatabaseAsync(SqlConnection master, string name, string path)
    {
        var log = Path.ChangeExtension(path, ".ldf");
        await SqlAsync(master, $"CREATE DATABASE [{name}] ON PRIMARY (NAME=N'{name}', FILENAME=N'{path.Replace("'", "''")}') LOG ON (NAME=N'{name}_log', FILENAME=N'{log.Replace("'", "''")}');");
    }

    private static async Task SqlAsync(SqlConnection connection, string sql)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync();
    }

    private static Task WriteConfigurationAsync(string path, string connection)
        => File.WriteAllTextAsync(path, JsonSerializer.Serialize(new { ConnectionStrings = new { BookCatalogContext = connection } }));

    private static async Task<int> CountAsync(SqlConnectionStringBuilder configuration)
    {
        await using var connection = new SqlConnection(configuration.ConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM dbo.Books";
        return (int)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<(int Code, string Output, string Error)> RunAsync(string[] args)
    {
        using var output = new StringWriter();
        using var error = new StringWriter();
        var code = await Program.RunAsync(args, output, error);
        return (code, output.ToString(), error.ToString());
    }
}

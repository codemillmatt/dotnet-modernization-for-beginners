using System.Data;
using Microsoft.Data.SqlClient;

namespace BookCatalog.Data;

public static class SqlBookStore
{
    private const string Columns = "[Id], [Title], [Author], [ISBN], [PublishedYear], [IsActive], [CreatedDate]";

    public static async Task<SqlConnection> SourceConnectionAsync(SqlConnectionStringBuilder configuration)
    {
        var source = new SqlConnectionStringBuilder(configuration.ConnectionString);
        if (source.AttachDBFilename.Length > 0)
        {
            var file = source.AttachDBFilename;
            var catalog = source.InitialCatalog;
            source.AttachDBFilename = "";
            source.InitialCatalog = "master";
            await using var master = new SqlConnection(source.ConnectionString);
            await master.OpenAsync();
            await using var lookup = master.CreateCommand();
            lookup.CommandText = """
                SELECT DB_NAME(database_id) FROM sys.master_files
                WHERE type = 0 AND physical_name = @file
                """;
            lookup.Parameters.Add("@file", SqlDbType.NVarChar, 4000).Value = file;
            var database = await lookup.ExecuteScalarAsync() as string;
            if (database is null || catalog.Length > 0 && !string.Equals(catalog, database, StringComparison.OrdinalIgnoreCase))
                throw new TransferException("The source MDF is not already attached under the configured name. Start the legacy app first. This helper will not attach, create, or repair a database.");
            source.InitialCatalog = database;
        }
        return new SqlConnection(source.ConnectionString);
    }

    public static async Task<SourceIdentity> IdentityAsync(SqlConnection connection, SqlTransaction? transaction = null)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT DB_NAME()";
        var database = (string)(await command.ExecuteScalarAsync())!;
        // The named LocalDB endpoint is stable across instance restarts; its generated
        // SQL Server process name is not a durable source identifier.
        return new() { Server = connection.DataSource, Database = database };
    }

    public static async Task ValidateDestinationAsync(SqlConnection connection, BookSnapshot snapshot, AzureDeployment? azure, SqlTransaction? transaction = null)
    {
        var identity = await IdentityAsync(connection, transaction);
        if (string.Equals(snapshot.Source.Server, identity.Server, StringComparison.OrdinalIgnoreCase)
            && string.Equals(snapshot.Source.Database, identity.Database, StringComparison.OrdinalIgnoreCase))
            throw new TransferException("The source and destination are the same database. Refusing to write to the source.");
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT CONVERT(int, SERVERPROPERTY('IsLocalDB')), CONVERT(int, SERVERPROPERTY('EngineEdition')), CONVERT(nvarchar(128), SERVERPROPERTY('ServerName'))";
        await using var reader = await command.ExecuteReaderAsync();
        await reader.ReadAsync();
        if (azure is null)
        {
            if (identity.Database != Configuration.LocalDatabase || reader.IsDBNull(0) || reader.GetInt32(0) != 1)
                throw new TransferException("The connected database is not the approved LocalDB destination.");
        }
        else if (identity.Database != azure.Database || reader.GetInt32(1) != 5
            || !string.Equals(reader.GetString(2).Split('.')[0], azure.ServerName, StringComparison.OrdinalIgnoreCase))
            throw new TransferException("The connected Azure SQL server/database differs from the deployment outputs.");
    }

    public static async Task<TimestampStorage> ValidateSchemaAsync(SqlConnection connection, bool destination, SqlTransaction? transaction = null)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            SELECT c.name, TYPE_NAME(c.system_type_id), c.max_length, c.is_nullable,
                   c.is_identity, c.is_computed, c.scale,
                   CONVERT(bit, CASE WHEN c.user_type_id = c.system_type_id THEN 1 ELSE 0 END) AS builtin_type
            FROM sys.columns AS c
            JOIN sys.tables AS t ON c.object_id = t.object_id
            WHERE t.object_id = OBJECT_ID(N'dbo.Books', N'U') AND t.temporal_type = 0
            ORDER BY c.column_id;
            SELECT COUNT(*) FROM sys.indexes AS i
            JOIN sys.index_columns AS ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            JOIN sys.columns AS c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID(N'dbo.Books', N'U') AND i.is_primary_key = 1
              AND c.name = N'Id' AND ic.key_ordinal = 1
              AND (SELECT COUNT(*) FROM sys.index_columns WHERE object_id = i.object_id AND index_id = i.index_id) = 1;
            SELECT COUNT(*) FROM sys.triggers WHERE parent_id = OBJECT_ID(N'dbo.Books', N'U') AND is_disabled = 0;
            """;
        var expected = new Dictionary<string, (string Type, int Length, bool Nullable, bool Identity)>
        {
            ["Id"] = ("int", 4, false, true),
            ["Title"] = ("nvarchar", 400, false, false),
            ["Author"] = ("nvarchar", 200, false, false),
            ["ISBN"] = ("nvarchar", 26, true, false),
            ["PublishedYear"] = ("int", 4, true, false),
            ["IsActive"] = ("bit", 1, false, false)
        };
        var seen = new HashSet<string>(StringComparer.Ordinal);
        TimestampStorage? storage = null;
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var name = reader.GetString(0);
            var type = reader.GetString(1);
            var length = reader.GetInt16(2);
            var nullable = reader.GetBoolean(3);
            var identity = reader.GetBoolean(4);
            var computed = reader.GetBoolean(5);
            var scale = reader.GetByte(6);
            if (!seen.Add(name) || computed || !reader.GetBoolean(7))
                throw SchemaError();
            if (name == "CreatedDate")
            {
                if (nullable || identity || !(type == "datetime" && scale == 3 || type == "datetime2" && scale <= 7)
                    || destination && (type != "datetime2" || scale != 7))
                    throw SchemaError();
                storage = new() { Type = type, Scale = scale };
            }
            else if (!expected.TryGetValue(name, out var column) || column != (type, length, nullable, identity))
                throw SchemaError();
        }
        if (seen.Count != 7 || storage is null) throw SchemaError();
        await reader.NextResultAsync();
        await reader.ReadAsync();
        if (reader.GetInt32(0) != 1) throw SchemaError();
        await reader.NextResultAsync();
        await reader.ReadAsync();
        if (destination && reader.GetInt32(0) != 0)
            throw new TransferException("The destination Books table has an enabled trigger. Refusing unreviewed write behavior.");
        return storage;
    }

    private static TransferException SchemaError()
        => new("Unexpected dbo.Books schema. Require the seven BookCatalog columns, their nullability/lengths, and an identity Id primary key. Destination CreatedDate must be datetime2(7). No schema was changed.");

    public static async Task<BookRow[]> ReadAsync(SqlConnection connection, int[] ids, SqlTransaction? transaction = null, bool lockForApply = false)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        var names = ids.Select((_, i) => $"@id{i}").ToArray();
        for (var i = 0; i < ids.Length; i++) command.Parameters.Add(names[i], SqlDbType.Int).Value = ids[i];
        var hints = lockForApply ? " WITH (UPDLOCK, HOLDLOCK)" : "";
        command.CommandText = $"SELECT {Columns} FROM [dbo].[Books]{hints} WHERE [Id] IN ({string.Join(", ", names)}) ORDER BY [Id]";
        var books = new List<BookRow>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            books.Add(new()
            {
                Id = reader.GetInt32(0),
                Title = reader.GetString(1),
                Author = reader.GetString(2),
                ISBN = reader.IsDBNull(3) ? null : reader.GetString(3),
                PublishedYear = reader.IsDBNull(4) ? null : reader.GetInt32(4),
                IsActive = reader.GetBoolean(5),
                CreatedDate = DateTime.SpecifyKind(reader.GetDateTime(6), DateTimeKind.Unspecified)
            });
        }
        return books.ToArray();
    }

    public static async Task<TransferPlan> ApplyAsync(SqlConnection connection, BookSnapshot snapshot, AzureDeployment? azure = null)
    {
        SnapshotFile.Validate(snapshot);
        // Serializable plus key-range locks makes the decision and inserts one atomic operation.
        using var transaction = connection.BeginTransaction(IsolationLevel.Serializable);
        await ValidateDestinationAsync(connection, snapshot, azure, transaction);
        var ids = snapshot.Books.Select(b => b.Id).Order().ToArray();
        var existing = await ReadAsync(connection, ids, transaction, true);
        await ValidateSchemaAsync(connection, true, transaction);
        var plan = TransferPlan.Create(snapshot.Books, existing);
        plan.RequireNoConflicts();
        if (plan.Missing.Length > 0)
        {
            await ExecuteAsync(connection, transaction, "SET XACT_ABORT ON; SET IDENTITY_INSERT [dbo].[Books] ON;");
            foreach (var row in plan.Missing)
            {
                await using var insert = connection.CreateCommand();
                insert.Transaction = transaction;
                insert.CommandText = $"INSERT INTO [dbo].[Books] ({Columns}) VALUES (@id, @title, @author, @isbn, @year, @active, @created)";
                insert.Parameters.Add("@id", SqlDbType.Int).Value = row.Id;
                insert.Parameters.Add("@title", SqlDbType.NVarChar, 200).Value = row.Title;
                insert.Parameters.Add("@author", SqlDbType.NVarChar, 100).Value = row.Author;
                insert.Parameters.Add("@isbn", SqlDbType.NVarChar, 13).Value = (object?)row.ISBN ?? DBNull.Value;
                insert.Parameters.Add("@year", SqlDbType.Int).Value = (object?)row.PublishedYear ?? DBNull.Value;
                insert.Parameters.Add("@active", SqlDbType.Bit).Value = row.IsActive;
                var timestamp = insert.Parameters.Add("@created", SqlDbType.DateTime2);
                timestamp.Scale = 7;
                timestamp.Value = row.CreatedDate;
                await insert.ExecuteNonQueryAsync();
            }
            await ExecuteAsync(connection, transaction, "SET IDENTITY_INSERT [dbo].[Books] OFF;");
        }
        var verified = TransferPlan.Create(snapshot.Books, await ReadAsync(connection, ids, transaction));
        if (verified.Missing.Length != 0 || verified.Conflicting.Length != 0)
            throw new TransferException("Exact comparison failed inside the transaction. The copy was rolled back.");
        await transaction.CommitAsync();
        return plan;
        // Disposing an uncommitted transaction rolls back. The caller always disposes the
        // nonpooled connection, so failed IDENTITY_INSERT state cannot reach another operation.
    }

    private static async Task ExecuteAsync(SqlConnection connection, SqlTransaction transaction, string sql)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync();
    }
}

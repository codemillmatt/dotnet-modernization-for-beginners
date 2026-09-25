using System.ComponentModel;
using System.Text.Json;
using System.Xml;
using Azure.Identity;
using Microsoft.Data.SqlClient;

namespace BookCatalog.Data;

public static class Program
{
    public static Task<int> Main(string[] args) => RunAsync(args, Console.Out, Console.Error);

    public static async Task<int> RunAsync(string[] args, TextWriter output, TextWriter error)
    {
        try
        {
            var command = CommandLine.Parse(args);
            if (command.Operation == "export")
            {
                var ids = CommandLine.ParseIds(command.Values["--ids"]);
                var configuration = Configuration.ReadLocal(command.Values["--source-config"], false);
                var path = Path.GetFullPath(command.Values["--output"]);
                if (File.Exists(path)) throw new TransferException("Output already exists. Choose a new snapshot filename; existing files are never replaced.");
                if (!Directory.Exists(Path.GetDirectoryName(path)))
                    throw new TransferException("Create the output directory first. Use the ignored .bookcatalog-lab directory.");
                await using var source = await SqlBookStore.SourceConnectionAsync(configuration);
                await source.OpenAsync();
                await SqlBookStore.ValidateSchemaAsync(source, false);
                using var readTransaction = source.BeginTransaction(System.Data.IsolationLevel.Serializable);
                var books = await SqlBookStore.ReadAsync(source, ids, readTransaction);
                var storage = await SqlBookStore.ValidateSchemaAsync(source, false, readTransaction);
                if (books.Length != ids.Length)
                    throw new TransferException($"Selected IDs not found: {string.Join(", ", ids.Except(books.Select(b => b.Id)))}. No snapshot was written.");
                var snapshot = new BookSnapshot
                {
                    FormatVersion = 1,
                    Source = await SqlBookStore.IdentityAsync(source, readTransaction),
                    CreatedDateStorage = storage,
                    Books = books
                };
                await readTransaction.CommitAsync();
                await SnapshotFile.WriteNewAsync(path, snapshot);
                await output.WriteLineAsync($"Exported {books.Length} selected records. Source was read only. Snapshot: {path}");
                return 0;
            }

            var input = await SnapshotFile.ReadAsync(command.Values["--input"]);
            AzureDeployment? azure = null;
            SqlConnection target;
            if (command.Values.TryGetValue("--target-config", out var targetPath))
                target = new SqlConnection(Configuration.ReadLocal(targetPath, true).ConnectionString);
            else
            {
                azure = AzureDeployment.Parse(await File.ReadAllTextAsync(command.Values["--azure-outputs"]));
                target = await new AzureTarget(azure, AzureTarget.RunCliAsync).ConnectAsync();
            }
            await using (target)
            {
                await target.OpenAsync();
                await SqlBookStore.ValidateDestinationAsync(target, input, azure);
                await SqlBookStore.ValidateSchemaAsync(target, true);
                await output.WriteLineAsync($"Destination: {target.DataSource} / {target.Database}");
                var plan = TransferPlan.Create(input.Books, await SqlBookStore.ReadAsync(target, input.Books.Select(b => b.Id).ToArray()));
                foreach (var id in plan.Matching) await output.WriteLineAsync($"ID {id}: already matches all stored values.");
                foreach (var row in plan.Missing) await output.WriteLineAsync($"ID {row.Id}: missing.");
                foreach (var conflict in plan.Conflicting)
                    await output.WriteLineAsync($"ID {conflict.Id}: differs in {string.Join(", ", conflict.Fields)}.");
                if (command.Operation == "verify")
                {
                    if (plan.Missing.Length != 0 || plan.Conflicting.Length != 0)
                        throw new TransferException("Verification failed. No rows were changed.");
                    await output.WriteLineAsync($"Verified {plan.Matching.Length} records: IDs and all stored values match exactly.");
                    return 0;
                }
                plan.RequireNoConflicts();
                if (!command.Apply)
                {
                    await output.WriteLineAsync($"PREVIEW ONLY: {plan.Missing.Length} would be inserted; {plan.Matching.Length} already match. No rows changed. Use --apply only after reviewing this destination.");
                    return 0;
                }
                var applied = await SqlBookStore.ApplyAsync(target, input, azure);
                await output.WriteLineAsync($"Applied and verified: {applied.Missing.Length} inserted; {applied.Matching.Length} already matched. No records overwritten.");
            }
            return 0;
        }
        catch (TransferException ex) { await error.WriteLineAsync(ex.Message); }
        catch (SqlException ex)
        {
            await error.WriteLineAsync($"SQL operation failed (error {ex.Number}). No success is assumed. Check the existing database, schema, permissions, and network access. An uncommitted copy is rolled back. Run verify before retrying.");
        }
        catch (AuthenticationFailedException) { await error.WriteLineAsync("Azure CLI authentication failed. No credentials were logged. Check the approved user login and subscription."); }
        catch (IOException) { await error.WriteLineAsync("File operation failed. Check paths, permissions, and whether the output already exists. Existing files are not replaced."); }
        catch (UnauthorizedAccessException) { await error.WriteLineAsync("Access denied. Check file permissions; do not supply or print credentials."); }
        catch (XmlException) { await error.WriteLineAsync("Invalid XML configuration. DTDs and external entities are not accepted."); }
        catch (JsonException) { await error.WriteLineAsync("Invalid JSON input."); }
        catch (Win32Exception) { await error.WriteLineAsync("Could not start Azure CLI. Install it only for the optional cloud operation."); }
        return 1;
    }
}

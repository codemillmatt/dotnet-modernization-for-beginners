# Copy selected BookCatalog records

This .NET 10 console helper copies a small, explicit set of book records.
It is not part of the learner's BookCatalog solution.
Do not include it in the agent's application upgrade scope.

Inspect the selected IDs and destination before you apply a copy.
The helper does not create a database, apply a schema, or fix a conflict.
This exercise is not a production backup, migration, or cutover procedure.

## What each command does

| Command | Result | Database changes |
| --- | --- | --- |
| `export` | Writes a new, versioned JSON snapshot of the selected source rows. | None. |
| `import` | Reports missing, matching, and conflicting destination rows. This is the default preview. | None. |
| `import --apply` | Inserts missing rows with their original IDs. Verifies the selected set before commit. | One transaction. No updates or deletes. |
| `verify` | Compares every selected ID and stored field with the snapshot. | None. |

Matching rows are reported as already present. A repeated apply inserts nothing.
A conflicting ID stops the entire copy.
A failed insert or exact comparison rolls back the transaction.
The helper never deletes, recreates, detaches, overwrites, or repairs a database.
It never replaces an existing snapshot or configuration file.

An exit code of `0` means that the requested operation passed.
An exit code of `1` means a validation, file, connection, authentication, or SQL failure.
Preview also fails if an existing ID conflicts.
Verification fails if any selected row is missing or different.
Unexpected runtime faults also terminate unsuccessfully.
They are not reported as a successful copy.
After a connection failure during apply, run `verify` before retrying.
A lost commit response can leave the client unable to confirm a completed commit.

## Prerequisites and limits

For the local exercise:

- Use Windows, PowerShell, the .NET 10 SDK, and SQL Server LocalDB.
- Start the legacy application first. Its source database must already be attached.
- Start the upgraded app with its separate lab database and expected schema.
- Confirm its connection uses Windows integrated security and `BookCatalogModernizedLab`.
- Run commands from the repository root.
- Use the actual IDs from your learner record. Do not infer IDs from book titles.
- Close the apps before the copy so that their initializers and users do not change the data.

NuGet dependencies restore through `dotnet run` or `dotnet test`.
A separate NuGet CLI, Node.js, and Python are not required by this helper.
Local operations do not run Azure CLI or acquire Azure credentials.

The helper reads the named configuration file only.
It does not merge `appsettings.Development.json`, environment variables, or user secrets.
Ensure that the file identifies the same database your application actually uses.

Only the `dbo.Books` table is supported, with these columns:

| Column | Required SQL shape |
| --- | --- |
| `Id` | `int`, non-null, identity, single-column primary key |
| `Title` | `nvarchar(200)`, non-null |
| `Author` | `nvarchar(100)`, non-null |
| `ISBN` | `nvarchar(13)`, nullable |
| `PublishedYear` | `int`, nullable |
| `IsActive` | `bit`, non-null |
| `CreatedDate` | Non-null. Source: `datetime` or `datetime2`. Destination: `datetime2(7)`. |

Additional columns, computed columns, custom alias types, temporal tables, and enabled destination triggers are refused.
Other tables, such as EF migration history and the Azure lab marker, are left alone.
The helper does not copy relationships or other tables.
Destination constraints still apply. A rejected insert rolls back the selected set.

Select between 1 and 1,000 distinct positive IDs.
Missing selected source IDs fail the export without a snapshot.
Seed rows 1–7 receive no special treatment.
Matching rows are safe. Different values are conflicts.
The destination must be separate from the source recorded in the snapshot.
Source identity uses the named LocalDB endpoint and database, not its changing process name.
Keep this provenance unchanged when you copy the snapshot.

The current Windows identity needs source read and schema-metadata access.
Resolving an attached MDF also needs visibility of that file in `master.sys.master_files`.
LocalDB's instance owner normally has these permissions.
Apply needs destination `SELECT`, `INSERT`, and permission to enable `IDENTITY_INSERT` (`ALTER` on the table).
Do not grant the deployed application's runtime identity extra migration permissions.

## Export before the upgrade

Create the ignored snapshot directory once:

```powershell
New-Item -ItemType Directory -Path .bookcatalog-lab -Force
```

Replace both placeholders below with the actual IDs from your learner record.
Use your active record ID and your inactive record ID.
Do not run the export with the placeholder text.

```powershell
$ids = "<active-id>,<inactive-id>"

dotnet run --project tools\BookCatalog.Data -- export `
  --source-config shared-legacy-app\src\BookCatalog.Web\Web.config `
  --ids $ids `
  --output .bookcatalog-lab\books.json
```

`|DataDirectory|` in `AttachDbFilename` resolves to `App_Data` beside that `Web.config`.
The helper looks up the already attached file.
It does not attach an MDF or create an empty file if the database is missing.
If lookup fails, check the legacy app and configuration before you retry.

Export also accepts a .NET `appsettings.json` source configuration with an existing LocalDB database.
It does not support an Azure source.

Read the snapshot. Confirm the IDs, values, nulls, and inactive records.
Keep it unchanged as your baseline.
If you need a new export, use a new filename rather than replacing the original.
Snapshot files contain application data.
Keep them under `.bookcatalog-lab`.
Do not commit or publish them.
They contain no connection string, password, token, or account credential.

## Preview, apply, and verify locally

The upgraded app must use the existing `BookCatalogModernizedLab` database.
Do not point this operation at the legacy database.

Preview:

```powershell
dotnet run --project tools\BookCatalog.Data -- import `
  --input .bookcatalog-lab\books.json `
  --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json
```

Read the printed server and database.
Check each reported ID. `PREVIEW ONLY` means that no rows changed.
Preview is a point-in-time check, not a reserved import.
Apply rechecks the schema and rows inside a serializable transaction.

Apply only after you approve that destination:

```powershell
dotnet run --project tools\BookCatalog.Data -- import `
  --input .bookcatalog-lab\books.json `
  --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json `
  --apply
```

Compare the stored values:

```powershell
dotnet run --project tools\BookCatalog.Data -- verify `
  --input .bookcatalog-lab\books.json `
  --target-config shared-legacy-app\src\BookCatalog.Web\appsettings.json
```

For the completed reference, use `examples\modernized\src\BookCatalog.Web\appsettings.json` instead.
Do not use the reference as a substitute for the learner's upgraded application.

The snapshot preserves `Id`, `Title`, `Author`, `ISBN`, `PublishedYear`, `IsActive`, and `CreatedDate`.
Strings compare ordinally, including case and trailing spaces.
Null and empty string are different.
The helper uses SQL parameters and supplies every field explicitly.
It does not assign a new ID or invoke model constructors with default dates or active states.

Snapshots record source timestamp type and scale.
The snapshot is strict UTF-8 JSON with all version 1 fields present, even when their values are null.
Unknown or duplicate fields, invalid Unicode, and unsupported versions are refused.
Timestamps use seven fractional digits without a time-zone suffix.
They preserve the stored values returned by SqlClient, not the date-only UI display.
Legacy SQL `datetime` already rounds to its supported precision.
Export cannot recover the original input before that rounding.
The helper does not convert timestamps to UTC or substitute the current time.

## Optional Azure destination

Do not run these commands until the optional deployment is approved.
They contact Azure, including for preview and verification.
Local helper tests do not establish that live Azure permissions or networking work.

Before this step:

1. Follow the [reviewed Azure lab procedure](../../examples/azure/README.md).
2. Obtain unmodified deployment outputs from `examples\azure\main.bicep`.
   Keep the outputs object at `.azure-lab\outputs.json`.
   Each output must retain its `type` and `value` fields.
3. Confirm the intended subscription, dedicated `rg-bookcatalog-*` resource group, and `BookCatalogLab` database.
4. Apply the reviewed schema with the Azure lab bootstrap helper first.
5. Install Azure CLI for this optional operation, if it is not already available.
6. Sign in as the approved Microsoft Entra **user** configured as the SQL server administrator.
   Select the deployment's subscription with Azure CLI.
   A service principal or the app's managed identity is not accepted for this exercise.
   The user must be able to read their Microsoft Graph user object and the lab's Azure resource metadata.
   This includes the resource-group tag and SQL server administrator configuration.
7. Arrange approved, temporary SQL firewall access for your public IP and outbound TCP port 1433.
   The bootstrap helper removes its own temporary firewall rule when it finishes.
   This data helper does not create rules. Remove your approved rule after verification.

The helper checks the CLI subscription and AzureCloud environment.
It checks the signed-in user's object ID against the live SQL administrator.
It also checks the server resource ID, FQDN, resource-group lab tag, connected database, and schema.
Output names must match the reviewed template.
The SQL token must identify the same user and tenant.
Only Azure CLI credentials are used.
There is no fallback to a developer IDE or managed identity.
Tokens remain in memory and are not printed.
The SQL connection requires encryption and certificate validation.

Preview:

```powershell
dotnet run --project tools\BookCatalog.Data -- import `
  --input .bookcatalog-lab\books.json `
  --azure-outputs .azure-lab\outputs.json
```

Apply after reviewing the identified server, database, and records:

```powershell
dotnet run --project tools\BookCatalog.Data -- import `
  --input .bookcatalog-lab\books.json `
  --azure-outputs .azure-lab\outputs.json `
  --apply
```

Verify:

```powershell
dotnet run --project tools\BookCatalog.Data -- verify `
  --input .bookcatalog-lab\books.json `
  --azure-outputs .azure-lab\outputs.json
```

Use either `--target-config` or `--azure-outputs`, never both.
The helper does not provision resources, apply schema, change permissions, create secrets, or delete the lab.
Keep the lab's resource and firewall cleanup steps in your learner record.

## If a check fails

- **A conflicting ID:** keep both the snapshot and source database unchanged.
  Inspect the destination and the fields named in the report.
  There is no force, overwrite, renumber, or delete option.
- **Unexpected schema:** compare the application's model and reviewed schema.
  Do not use this helper to repair the database.
- **Missing source database:** start the legacy app through its documented path.
  Do not create an empty MDF as a workaround.
- **Missing target database:** initialize the separate local lab through the upgraded app, or apply the approved Azure schema.
- **Azure failure:** check the approved user, subscription, permissions, output file, and firewall.
  Error output deliberately excludes raw authentication and SQL messages that could expose sensitive data.
- **Interrupted apply:** run `verify`, then preview again.
  Matching rows are safe on a repeated apply. Conflicting rows still stop it.

## Maintainer checks

Unit tests cover strict JSON, required nullable fields, timestamps, exact comparisons, conflicts, CLI modes, and destination/authentication guards:

```powershell
dotnet test tests\BookCatalog.Data.Tests\BookCatalog.Data.Tests.csproj
```

The real SQL Server integration test is skipped in that command unless the isolated harness supplies its instance.
Run the harness on Windows:

```powershell
.\scripts\Test-DataTransfer.ps1
```

The harness creates a uniquely named LocalDB instance and run directory under `.bookcatalog-lab`.
It creates its own legacy-shaped source and modernized destination.
It tests attached-file resolution, deterministic export, preview, exact copy, repeat apply, conflicting IDs, mid-transaction SQL failure, schema guards, and source preservation.
It also tests seven-digit `datetime2` values.
It drops only its own databases, stops/deletes only its own instance, and removes only its marked run directory.
It does not connect to `MSSQLLocalDB`, the learner's source, or Azure.
If cleanup fails, it reports the owned instance and directory instead of deleting unrelated files.

Azure path tests use mocked CLI responses and token acquisition.
Live Azure validation remains a separate, explicitly approved check.

# Optional lab: copy selected BookCatalog records

This is a standalone, opt-in reference for copying selected records. It isn't part of the core upgrade or deployment flow.

The core course lets EF Core rebuild and seed `BookCatalogModernizedLab`. It doesn't require data preservation.

Choose this exercise only if you want to learn an explicit import. Its snapshot and exact-value comparisons belong to that exercise.

This exercise uses its own legacy clone. It doesn't assume that your learner copy still has `Web.config` or its earlier records.

<a id="prepare-before-the-upgrade"></a>
## Prepare a standalone legacy source

Use Windows, PowerShell, a stable .NET SDK 10 or later, and LocalDB.

The helper and modernized app target .NET 10. Keep the .NET 10 runtime components installed even if you use a later SDK.

Run these commands from your original repository root, not from the new clone:

```powershell
New-Item -ItemType Directory -Force .bookcatalog-lab -ErrorAction Stop | Out-Null
git clone --depth 1 https://github.com/microsoft/dotnet-modernization-for-beginners.git .bookcatalog-lab\legacy-source
if ($LASTEXITCODE -ne 0) { throw "Source clone failed. Inspect the Git error before continuing." }
```

The source solution is `.bookcatalog-lab\legacy-source\shared-legacy-app\BookCatalog.sln`. On a later visit, reopen it instead of cloning again.

In Visual Studio, select **File > Open > Project/Solution** and open that source solution.

Restore NuGet packages, then select **Build > Rebuild Solution**. Select **IIS Express** and press F5.

Expect the active catalog to load. If startup fails, use the [legacy quickstart's error guidance](../shared-legacy-app/README.md#windows-quickstart).

Leave this copy on .NET Framework 4.8. Don't run modernization against it.

Use sample data for the records below. This source is separate from any database recreated during your core upgrade.

The supplied [data helper](../tools/BookCatalog.Data/README.md) runs outside `BookCatalog.sln`. Keep it outside the modernization agent's application-upgrade scope.

The helper reads the source and writes a new snapshot. It doesn't create, attach, repair, or migrate a database or schema.

<a id="choose-the-records-that-must-survive"></a>
## Choose records to copy

Create these two records through the running standalone **legacy** app:

| Field | Active record | Inactive record |
| --- | --- | --- |
| Title | `Aster field notes` | `Dormant atlas` |
| Author | `Rowan Example` | `Mira Sample` |
| ISBN | `9780000000001` | Leave blank |
| Published Year | `2024` | Leave blank |

1. Select **Active** when creating each book so both appear in the list.
2. Open each book's **Details** link.
3. Save each assigned ID and `/Books/Details/<actual-id>` path, using the number from its URL.
4. Edit **Dormant atlas**, clear **Active**, and save.

The inactive record now leaves the list, but its saved details URL still works. Don't assume the IDs are `8` and `9`.

Keep the selected values unchanged until verification finishes.

The blank fields let you check SQL `NULL` preservation. A blank form field doesn't establish how SQL stores it.

The details page shows only the date part of `CreatedDate`. The export captures the stored value for a full-precision comparison.

<a id="include-the-lab-in-your-plan"></a>
## Keep transfer outside the upgrade plan

Don't add this reference as a prerequisite for assessment, planning, or execution. Run its commands only when you've chosen an import exercise.

The helper requires a source and destination with its [supported schema](#helper-limits-and-supported-schema). It doesn't share or migrate an EF6 schema.

Existing target records can conflict with your selected IDs. The helper reports those conflicts instead of overwriting rows.

For this explicit import, inspect the destination before applying. The local helper accepts only `BookCatalogModernizedLab` and refuses the source database.

<a id="export-the-selected-records-before-the-upgrade"></a>
## Export from the standalone source

Stop debugging after saving the two records. Use the source clone's configuration, not the learner app's configuration.

Run the following in PowerShell from the repository root. Replace both placeholders with your actual IDs:

```powershell
$ids = "<active-id>,<inactive-id>"
dotnet run --project tools\BookCatalog.Data -- export --source-config .bookcatalog-lab\legacy-source\shared-legacy-app\src\BookCatalog.Web\Web.config --ids $ids --output .bookcatalog-lab\books.json
if ($LASTEXITCODE -ne 0) { throw "Source export failed. Inspect the error before retrying the export." }
```

Export refuses an existing output file. When resuming, inspect and reuse the saved snapshot. For a new attempt, choose a new filename.

Use that same filename in every later `--input` argument.

`|DataDirectory|` resolves to `App_Data` beside `Web.config`. The helper finds the already attached MDF. It won't attach or create one.

If an ID is missing, check it against the legacy database. Don't substitute a seed record merely to make export succeed.

Inspect the snapshot and confirm that Git ignores it:

```powershell
Get-Content .bookcatalog-lab\books.json
git check-ignore .bookcatalog-lab\books.json
if ($LASTEXITCODE -ne 0) { throw "Keep the snapshot out of Git before continuing." }
```

Check both IDs and every field. Confirm the inactive state and the stored `null` values for its blank fields.

The snapshot has this structure. These are field descriptions, not a replacement snapshot:

| Field | Meaning |
| --- | --- |
| `formatVersion` | Must be `1` |
| `source.server`, `source.database` | Original named endpoint and attached database |
| `createdDateStorage.type`, `createdDateStorage.scale` | Source timestamp SQL type and precision |
| `books` | Selected rows with `id`, `title`, `author`, `isbn`, `publishedYear`, `isActive`, and `createdDate` |

Nullable fields must be present even when their value is `null`. Keep `null` distinct from an empty string.

Timestamps have seven fractional digits and no time-zone suffix. Don't convert them to UTC, round them, or substitute the current time.

Legacy SQL `datetime` has already rounded its stored values. Export preserves what SQL returns. It can't recover precision lost before export.

Keep the original snapshot unchanged, including its source identity. Don't commit, publish, or paste it into chat.

Export success reports how many selected records were written. It doesn't change the database.

## Preview, copy, and verify the selected records

This standalone exercise uses the completed reference as its destination. It doesn't validate your learner upgrade.

From the original repository root, start the reference:

```powershell
dotnet run --project examples\modernized\src\BookCatalog.Web
```

Expect the catalog at the console's local URL. The reference creates `BookCatalogModernizedLab` and its EF Core seed data when needed.

If startup reports a schema mismatch, follow the reference's [demo-reset instructions](../examples/modernized/README.md#run-on-windows).

Press Ctrl+C to stop the app before import. Set the target file in the same PowerShell session:

```powershell
$targetConfig = "examples\modernized\src\BookCatalog.Web\appsettings.json"
```

To test your own upgraded app instead, set `$targetConfig` to `shared-legacy-app\src\BookCatalog.Web\appsettings.json` and use that app for the checks.

Inspect `ConnectionStrings:BookCatalogContext` in the selected file. Account for any environment settings or user secrets that override it.

The helper reads only the named file. It doesn't merge ASP.NET Core configuration providers.

From the repository root, preview:

```powershell
dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --target-config $targetConfig
if ($LASTEXITCODE -ne 0) { throw "Import preview failed. Do not apply." }
```

Preview changes no rows. Read the `Destination:` line and check that it names your intended server and database.

Review every missing, matching, or conflicting row. `PREVIEW ONLY` isn't an import result.

A conflicting ID makes preview fail. Inspect the target and values before continuing.

If you choose a fresh demo destination, use the reference's reset instructions, then preview again. Resetting removes the destination's demo records.

The helper has no overwrite, force, renumber, or delete option.

Preview is a point-in-time check, not a reservation. Apply rechecks the rows and schema inside a serializable transaction.

Only after reviewing that destination, apply:

```powershell
dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --target-config $targetConfig --apply
if ($LASTEXITCODE -ne 0) { throw "Import failed. Inspect the error before continuing." }
```

Then compare stored values:

```powershell
dotnet run --project tools\BookCatalog.Data -- verify --input .bookcatalog-lab\books.json --target-config $targetConfig
if ($LASTEXITCODE -ne 0) { throw "Stored values do not match. The data check has not passed." }
```

Apply inserts missing rows with their original IDs. It neither updates nor deletes existing records.

The selected set is transactional. A conflict, failed insert, or failed exact comparison prevents a partial copy. Matching records aren't duplicated.

If apply loses its connection, run `verify` before retrying. A lost commit response doesn't prove that nothing changed.

Exit code `0` means the requested operation passed. Preview success still means only preview, not preservation.

Verify compares all seven fields. Strings compare ordinally, including case and trailing spaces. It compares full timestamps and distinguishes nulls from empty strings.

Don't edit the snapshot to hide a mismatch. See the [helper's failure guidance](../tools/BookCatalog.Data/README.md#if-a-check-fails).

<a id="check-the-legacy-source-remains-unchanged"></a>
## Check the copied records through the app

Restart the destination app and open its console URL. Use each selected ID in `/Books/Details/<actual-id>`.

The active record belongs in the list. The inactive record stays absent, but its details route still works.

Use a new disposable record for ordinary create, edit, inactive/restore, and deletion checks. Leave the copied pair unchanged.

Restart the app and check that the copied records remain. Stop the app and rerun `verify` against the same snapshot.

The [advanced checks](advanced-checks.md) cover server validation, antiforgery, and stored creation time. They remain optional.

## Helper limits and supported schema

This is a bounded sample-data exercise, not a production backup, general migration, or cutover procedure.

- Select 1–1,000 distinct positive IDs. Missing source IDs fail export without a snapshot.
- Local connections require an explicit named LocalDB instance and Windows integrated security, without credentials or failover.
- The local destination must already be named `BookCatalogModernizedLab`, without `AttachDbFilename`.
- Source and destination must differ. Keep the source identity in the snapshot unchanged.
- Close both apps during transfer. The helper doesn't coordinate other users or initializers.
- The helper copies only `dbo.Books`. It doesn't copy relationships or other tables.
- The helper never creates, deletes, detaches, recreates, repairs, or overwrites a database or configuration file.

Only these seven columns are supported:

| Column | Required SQL shape |
| --- | --- |
| `Id` | `int`, non-null, identity, single-column primary key |
| `Title` | `nvarchar(200)`, non-null |
| `Author` | `nvarchar(100)`, non-null |
| `ISBN` | `nvarchar(13)`, nullable |
| `PublishedYear` | `int`, nullable |
| `IsActive` | `bit`, non-null |
| `CreatedDate` | Non-null. Source: `datetime` or `datetime2`. Destination: `datetime2(7)`. |

Additional or computed columns, custom alias types, temporal tables, and enabled destination triggers are refused. Destination constraints still apply.

Other tables, including EF migration history and the Azure lab marker, are left alone.

Snapshots require strict UTF-8 JSON with every version 1 field. Unknown or duplicate fields, invalid Unicode, and unsupported versions are refused.

Source access needs read and schema-metadata permissions. Attached-file lookup also needs visibility in `master.sys.master_files`.

Apply needs destination `SELECT`, `INSERT`, and permission for `IDENTITY_INSERT` (`ALTER` on the table). Don't grant migration permissions to the deployed app.

The [helper reference](../tools/BookCatalog.Data/README.md) contains command modes, authentication boundaries, and maintainer checks.

## Optional Azure copy

Azure deployment is a separate, paid opt-in lab. Local data transfer doesn't authorize Azure access or resource creation.

Start with an approved deployed lab that hasn't been cleaned up. The [deployment procedure](../04-cloud/deployment.md) prepares EF Core schema and seeds.

Finish this separate exercise before deleting the dedicated Azure resource group.

For this separate import exercise, use the snapshot you've exported and the reviewed `.azure-lab\outputs.json`.

The helper supports AzureCloud and uses the approved Azure CLI SQL administrator, not the application's managed identity.

Keep each deployment output's `type` and `value`. The helper needs permission to read the signed-in user and the lab's Azure resource metadata.

Check the [Azure helper prerequisites](../tools/BookCatalog.Data/README.md#optional-azure-destination) before continuing. Even preview and verification contact Azure.

From the original repository root, load the deployment outputs. Replace `<your-public-ipv4>` with your current public IPv4 address from approved network tools:

```powershell
$outputs = Get-Content .azure-lab\outputs.json -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
$group = $outputs.resourceGroup.value
$clientIp = "<your-public-ipv4>"
```

In the Azure portal, open the lab's App Service **Overview** page. Select **Stop** before copying records.

The client needs approved outbound TCP port 1433. Don't broaden firewall access to work around network policy.

Bootstrap has removed its temporary client rule. This block opens another rule for exactly your client address and removes it afterward:

```powershell
if (-not (Test-Path .bookcatalog-lab\books.json -PathType Leaf)) {
    throw "Snapshot missing. Export the records you intend to import before continuing."
}
$copyRule = "workshop-copy-$([guid]::NewGuid().ToString('N'))"
try {
    az sql server firewall-rule create --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value `
      --name $copyRule --start-ip-address $clientIp --end-ip-address $clientIp -o none
    if ($LASTEXITCODE -ne 0) { throw "Client firewall rule creation failed." }
    dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --azure-outputs .azure-lab\outputs.json
    if ($LASTEXITCODE -ne 0) { throw "Cloud import preview failed." }
    $approval = Read-Host "Review target and rows. Type APPLY to copy these selected records"
    if ($approval -cne "APPLY") { throw "Copy not approved. No records were imported." }
    dotnet run --project tools\BookCatalog.Data -- import --input .bookcatalog-lab\books.json --azure-outputs .azure-lab\outputs.json --apply
    if ($LASTEXITCODE -ne 0) { throw "Cloud import failed." }
    dotnet run --project tools\BookCatalog.Data -- verify --input .bookcatalog-lab\books.json --azure-outputs .azure-lab\outputs.json
    if ($LASTEXITCODE -ne 0) { throw "Cloud stored-value verification failed." }
}
finally {
    az sql server firewall-rule delete --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value --name $copyRule -o none
    if ($LASTEXITCODE -ne 0) { throw "Client rule cleanup failed. Inspect and remove only this rule: $copyRule" }
}
```

Review the preview before typing `APPLY`. Successful verification reports that the selected IDs and all stored values match.

If apply loses its connection, verify before retrying. Don't overwrite conflicts or change the snapshot to make verification pass.

After verification and firewall cleanup, select **Start** on the App Service **Overview** page. Open the copied records through the deployed app.

Complete [scoped resource cleanup](../04-cloud/deployment.md#delete-the-dedicated-lab-group) even if the import fails.

**[Return to the local upgrade](../03-upgrade-execution/README.md)** · **[Course overview](../README.md)**

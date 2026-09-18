# Optional: deploy BookCatalog to Azure

This lab executes the reviewed plan from [Chapter 04](README.md). It is not required for course completion.

Use your upgraded learner application and the original `.bookcatalog-lab\books.json`. Do not deploy the completed reference instead.

> **Approval required.** This lab creates billable resources and a public application with no user authentication.
>
> Anyone with its URL can change book records. Use sample data only and an approved, dedicated lab scope.

The sequence is application preparation, local checks, resource approval, provisioning, schema preparation, selected-record copy, deployment, verification, and cleanup.

This revision has not had a live Azure walkthrough. Local and mocked checks do not prove deployment or cleanup.

See the [validation record](../docs/validation.md#unperformed-live-and-ui-checks) for that boundary.

## Check tools, access, and costs first

Use PowerShell from the repository root. Keep the same shell for the variables in this procedure.

The bootstrap helper needs Node 24 or a compatible version supported by `package.json`. Node is a helper runtime, not the application's runtime.

Check existing tools before installing:

```powershell
az version
az bicep version
node --version
npm --version
dotnet --list-sdks
```

Use the [Azure CLI installer](https://learn.microsoft.com/cli/azure/install-azure-cli), [Bicep instructions](https://learn.microsoft.com/azure/azure-resource-manager/bicep/install), or [Node installer](https://nodejs.org/en/download) only for missing requirements.

Confirm a stable .NET 10 SDK as in Chapter 00. Do not replace compatible runtimes merely to match a screenshot.

Review all services in the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/). Obtain approval for the subscription, region, budget, and cleanup owner.

The template defaults to App Service B1 and SQL Standard S0. They are not a promise of free hosting or regional capacity.

Read [cleanup](#delete-the-dedicated-lab-group) before creating resources. Do not use a group that contains another workload.

After access approval, sign in and select the intended subscription. Replace the placeholder:

```powershell
az login
if ($LASTEXITCODE -ne 0) { throw "Azure sign-in failed." }
$subscriptionId = "<approved-subscription-id>"
az account set --subscription $subscriptionId
if ($LASTEXITCODE -ne 0) { throw "Subscription selection failed." }
az account show --query "{subscription:id,tenant:tenantId,user:user.name}" -o json
if ($LASTEXITCODE -ne 0) { throw "Account verification failed." }
```

| Operation | Required access |
| --- | --- |
| Create dedicated resources | Resource creation rights in the approved scope |
| Assign Key Vault roles | Owner or appropriate delegated role-assignment rights |
| Apply schema and copy selected records | The Microsoft Entra user configured as SQL administrator |
| Store the connection setting | Key Vault Secrets Officer on the lab vault |
| Run the application | User-assigned identity with restricted vault/table permissions |

Contributor alone cannot assign roles. This template expects a signed-in Microsoft Entra **user**, not a service principal or group administrator.

Keep administrator credentials and tokens out of files, chat, snapshots, and logs.

## Prepare the application explicitly

Start from your saved local checkpoint. Identify the learner project:

```powershell
$project = (Resolve-Path "shared-legacy-app\src\BookCatalog.Web\BookCatalog.Web.csproj" -ErrorAction Stop).Path
```

Ask the agent to execute only the approved application-preparation group:

```text
Prepare my learner application for the reviewed Azure plan.
Add Key Vault configuration using the user-assigned managed identity.
Keep local operation independent of Azure when KeyVaultName is absent.
Guard local schema initialization and disable it for Azure.
Add design-time schema generation without a live database connection.
Preserve my behavior, selected records, and source snapshot.
Do not provision, deploy, or commit. Stop for diff review and local checks.
```

Review the package additions, including `Azure.Identity`, `Azure.Extensions.AspNetCore.Configuration.Secrets`, and compatible EF Core design support.

In `Program.cs`, Key Vault configuration belongs after builder creation and before reading the connection string.

This focused block illustrates the intended responsibility. Adapt it to your startup code rather than replacing the whole file:

```csharp
var vaultName = builder.Configuration["KeyVaultName"];
if (!string.IsNullOrWhiteSpace(vaultName))
{
    var clientId = builder.Configuration["AZURE_CLIENT_ID"]
        ?? throw new InvalidOperationException("Set AZURE_CLIENT_ID.");
    builder.Configuration.AddAzureKeyVault(
        new Uri($"https://{vaultName}.vault.azure.net/"),
        new ManagedIdentityCredential(
            ManagedIdentityId.FromUserAssignedClientId(clientId)));
}
```

The code needs `using Azure.Identity;`. The reviewed template supplies `KeyVaultName` and `AZURE_CLIENT_ID` in Azure.

Without `KeyVaultName`, local startup must not contact Azure. Do not replace the local connection with a cloud connection.

Find every automatic schema call. Guard local initialization with `InitializeDatabase` and an exact `BookCatalogModernizedLab` database-name check.

Inspect [the reference startup guard](../examples/modernized/src/BookCatalog.Web/Program.cs). The template sets `InitializeDatabase` to `false` in Azure.

The restricted runtime identity must not create schema. The approved administrator performs that step separately.

Rebuild and run locally as in Chapter 03. Repeat behavior checks and selected-record verification before provisioning.

Save reviewed application changes yourself. Ask the agent to reconcile plan progress with those actual checks.

## Produce a schema from your application

An EF Core design-time factory supplies database options when tooling inspects the model. It lets you generate SQL without connecting to Azure.

Review the factory the agent added against [the reference factory](../examples/modernized/src/BookCatalog.Web/Models/DesignDbContextFactory.cs).

Match the context type and namespace to your app. Match `Microsoft.EntityFrameworkCore.Design` to its other EF Core package versions.

From the repository root:

```powershell
dotnet tool restore
if ($LASTEXITCODE -ne 0) { throw "EF tool restore failed." }
New-Item -ItemType Directory -Force .azure-lab -ErrorAction Stop | Out-Null
dotnet ef dbcontext script --project $project --output .azure-lab\schema.sql
if ($LASTEXITCODE -ne 0) { throw "Schema generation failed." }
```

Inspect `.azure-lab\schema.sql` with the agent before applying it. It must create the expected `Books` shape and retain the seed base.

Check nullable fields, identity IDs, and `CreatedDate` as `datetime2(7)`. Compare all columns with the [helper's supported schema](../tools/BookCatalog.Data/README.md#prerequisites-and-limits).

Do not allow destructive operations against the local or legacy databases.

Seed inserts do not copy your selected records. The snapshot import remains a separate step.

## Review the infrastructure

Open [the supplied Bicep template](../examples/azure/main.bicep) and [helper guide](../examples/azure/README.md).

Bicep describes the Azure resources and their configuration. The supplied template bounds this lab and defines the outputs its helpers accept.

Ask the agent:

```text
Compare our cloud plan and proposed changes with examples\azure\main.bicep.
Identify any mismatch in resources, identities, database names, or outputs.
Explain the cost and public-access boundaries.
Do not replace the reviewed template or deploy anything yet.
```

The template creates App Service, Azure SQL, Key Vault, and a user-assigned identity. SQL uses Microsoft Entra authentication without a SQL administrator password.

> The SQL firewall allows Azure-service traffic for this lab. That rule is broader than an application-specific network rule.
>
> Public endpoints, sample data, and limited permissions do not make this design production ready. Production needs its own access and networking review.

Compile the template locally:

```powershell
az bicep build --file examples\azure\main.bicep --outfile .azure-lab\main.json
if ($LASTEXITCODE -ne 0) { throw "Bicep compilation failed." }
```

Compilation checks syntax and types. It does not establish quota, permissions, identity propagation, or live deployment success.

<div class="activity">

### Your review: what can each identity do?

Find the two Key Vault role assignments. Identify the runtime identity and your administrator identity.

Explain why the runtime needs secret reads but not secret writes. Inspect the SQL helper's table permissions.

Explain why selected-record import uses your approved administrator identity instead.

</div>

## Provision the dedicated lab

> The following commands create resources. Recheck subscription, region, budget, and scope approval before running them.

Replace the region placeholder. Create a unique dedicated group:

```powershell
$location = "<approved-region>"
$group = "rg-bookcatalog-$([guid]::NewGuid().ToString('N').Substring(0,8))"
$userJson = az ad signed-in-user show -o json
if ($LASTEXITCODE -ne 0) { throw "Signed-in user verification failed." }
$user = $userJson | ConvertFrom-Json -ErrorAction Stop
az group create --name $group --location $location --tags workshop=dotnet-modernization -o none
if ($LASTEXITCODE -ne 0) { throw "Resource group creation failed." }
```

Record the group name immediately. You need it for cleanup even if deployment fails before producing outputs.

Check proposed resource changes:

```powershell
az deployment group what-if --resource-group $group `
  --template-file examples\azure\main.bicep `
  --parameters administratorObjectId=$($user.id) administratorName=$($user.userPrincipalName)
if ($LASTEXITCODE -ne 0) { throw "The what-if check failed." }
```

What-if calls Azure. It does not create the proposed resources, but it also does not guarantee available capacity.

Review the result against the plan. Then deploy the template:

```powershell
$result = az deployment group create --name bookcatalog --resource-group $group `
  --template-file examples\azure\main.bicep `
  --parameters administratorObjectId=$($user.id) administratorName=$($user.userPrincipalName) `
  --query properties.outputs -o json
if ($LASTEXITCODE -ne 0) { throw "Deployment failed. Inspect the Azure error before retrying." }
$result | Out-File .azure-lab\outputs.json -Encoding utf8 -ErrorAction Stop
$outputs = $result | ConvertFrom-Json -ErrorAction Stop
```

Inspect the outputs. Confirm the exact group, subscription, SQL server, `BookCatalogLab` database, application, vault, and identity.

Do not change region or tier without reviewing cost and resource placement again. No particular quota failure is an expected lesson step.

## Apply the schema and application permissions

The supplied Node helper prepares an empty database and grants runtime permissions. It does not copy your selected local records.

Check helper dependencies with `npm ls --depth=0`. If required dependencies are missing, run `npm ci` from the repository root.

Stop if dependency installation fails. Do not continue with an incomplete helper environment.

Set `$clientIp` to your current public IPv4 address from approved network tools. Never use `0.0.0.0` as the client rule.

```powershell
$clientIp = "<your-public-ipv4>"
node examples\azure\lab.mjs bootstrap .azure-lab\outputs.json $clientIp .azure-lab\schema.sql
if ($LASTEXITCODE -ne 0) { throw "Database preparation failed. Inspect the helper error." }
```

The helper uses your Azure CLI administrator identity. It opens a temporary firewall rule for exactly that IPv4 address and removes it afterward.

It applies the schema transactionally and records its fingerprint. An exact retry accepts that schema. An unrelated existing database or changed fingerprint is refused.

The runtime identity receives `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `dbo.Books`, not schema-change permissions.

The helper stores `ConnectionStrings--BookCatalogContext` in Key Vault. The configuration provider maps `--` to `:`.

If roles or identity changes are not yet available, inspect the error before retrying. A fixed wait is not proof that access is ready.

If firewall cleanup fails, remove only that run's named temporary rule. Do not remove another learner's rule.

## Copy the same selected records

Use the **original** `.bookcatalog-lab\books.json`, not a new export of seed records.

The [.NET data helper](../tools/BookCatalog.Data/README.md) uses reviewed deployment outputs with `--azure-outputs`, instead of local `--target-config`.

Cloud copy and verification use the approved Azure CLI SQL administrator, not the runtime managed identity. No credentials belong in the snapshot.

This helper supports the AzureCloud environment. Keep the deployment outputs unchanged, including each output's `type` and `value`.

Azure CLI must read your signed-in user object and the group's, server's, and SQL administrator's metadata. Check policy restrictions before attempting the copy.

Bootstrap has closed its temporary firewall rule. Open a separate rule for your current client address only while copying and checking records.

The client also needs outbound TCP port 1433. If network policy blocks it, seek approved access instead of broadening the server rule.

Keep cleanup in `finally` so a failed copy also closes the rule:

```powershell
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

Review the preview **before** typing `APPLY`. Record each operation's actual result.

A conflicting ID must stop the copy. Do not change IDs, overwrite rows, or alter the snapshot to force a match.

If apply loses its connection, verify before retrying. Do not treat an uncertain commit response as proof that nothing changed.

Keep the two carry-forward records unchanged in Azure too. Use another throwaway record for web edits and deletion.

## Publish your learner application

Check that `$project` still points to `shared-legacy-app`, not `examples\modernized`.

If an earlier attempt left `.azure-lab\publish`, inspect it before reusing the directory. Remove only that attempt's old build output.

```powershell
dotnet publish $project -c Release -o .azure-lab\publish
if ($LASTEXITCODE -ne 0) { throw "Application publish failed." }
Compress-Archive -Path .azure-lab\publish\* -DestinationPath .azure-lab\app.zip -Force -ErrorAction Stop
az webapp deploy --subscription $outputs.subscriptionId.value --resource-group $group --name $outputs.appName.value `
  --src-path .azure-lab\app.zip --type zip
if ($LASTEXITCODE -ne 0) { throw "Application deployment failed." }
```

Open `$outputs.appUrl.value`. Use each selected ID on this new host to open its details route.

Check active filtering and title order. Repeat the [behavior checks](../docs/learner-record.md#behavior-checks) using a new throwaway record.

Use the cloud URL for request checks. For database inspection, use approved client access to Azure SQL, not the local database.

Restart the application before deleting that record:

```powershell
az webapp restart --subscription $outputs.subscriptionId.value --resource-group $group --name $outputs.appName.value
if ($LASTEXITCODE -ne 0) { throw "Application restart failed." }
```

Check its saved values after restart. Finish its inactive/restore and validation checks.

Keep the throwaway record until the stored creation-time check below. Do not delete it yet.

HTTP 200 alone does not establish database writes or persistence. A date-only details page does not establish timestamp preservation.

For a startup failure, inspect App Service logs. Check identity binding, vault role, secret name, SQL user, and schema separately.

Do not grant broad runtime permissions to hide an administrator setup error.

### Verify stored values after restart

Reopen only the narrow client rule for stored-value checks. Do not rerun import to hide lost data.

The pause in this block keeps client access open for SQL Server Object Explorer. Connect to `$outputs.sqlServerFqdn.value` with the approved administrator.

Select `BookCatalogLab`. Use the [read-only creation-time query](../00-introduction/README.md#check-behavior-with-a-separate-record) with your cloud throwaway ID.

Record its stored `CreatedDate`, edit that record through the website, and query again. After comparing the values, return to PowerShell and press Enter.

```powershell
$verifyRule = "workshop-verify-$([guid]::NewGuid().ToString('N'))"
try {
    az sql server firewall-rule create --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value `
      --name $verifyRule --start-ip-address $clientIp --end-ip-address $clientIp -o none
    if ($LASTEXITCODE -ne 0) { throw "Verification firewall rule creation failed." }
    Read-Host "Check throwaway CreatedDate before and after a web edit. Press Enter when done" | Out-Null
    dotnet run --project tools\BookCatalog.Data -- verify --input .bookcatalog-lab\books.json --azure-outputs .azure-lab\outputs.json
    if ($LASTEXITCODE -ne 0) { throw "Post-restart stored values do not match." }
}
finally {
    az sql server firewall-rule delete --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value --name $verifyRule -o none
    if ($LASTEXITCODE -ne 0) { throw "Client rule cleanup failed. Inspect and remove only this rule: $verifyRule" }
}
```

Record the result. Ask the agent to reconcile the cloud plan's progress with your observed evidence and unresolved failures.

Delete the throwaway record through the website and confirm its details route returns 404. Keep the carry-forward records unchanged.

If deployment must be rolled back, follow the reviewed recovery boundary. Restoring application code does not restore database state.

## Delete the dedicated lab group

> Cleanup deletes every resource in the named group. Inspect `.azure-lab\outputs.json` and confirm ownership before authorizing it.

From the repository root:

```powershell
node examples\azure\lab.mjs cleanup .azure-lab\outputs.json --confirm-delete
if ($LASTEXITCODE -ne 0) { throw "Cleanup is not complete." }
```

The helper checks the subscription and workshop tag. It waits for deletion and confirms that the exact group no longer exists.

Key Vault can retain recoverable metadata. Do not purge it for this exercise.

If deployment failed before producing outputs, use your recorded `$group` and the Azure portal. Delete only that dedicated group after inspecting its contents and ownership.

Do not delete the legacy database, local target, or source snapshot as cloud cleanup.

Record cleanup as passed only after confirming resource-group removal. Record failed or unrun application checks separately.

**[Return to Azure planning](README.md)** · **[Course overview](../README.md)**

# Optional: deploy BookCatalog to Azure

This lab executes the reviewed plan from [Chapter 04](README.md). It isn't required for course completion.

Use your upgraded learner application. Don't deploy the completed reference instead.

You'll generate the schema and seeds from EF Core, then check a new disposable record through the cloud app.

> **Approval required.** This lab creates billable resources and a public application with no user authentication.
>
> Anyone with its URL can change book records. Use sample data only and an approved, dedicated lab scope.

The sequence is application preparation, local checks, resource approval, provisioning, schema and seed preparation, deployment, app checks, and cleanup.

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

Confirm a stable .NET SDK 10 or later with the [setup checks](../prerequisites/README.md#check-before-installing). Don't replace compatible runtimes merely to match a screenshot.

The app still targets .NET 10. Keep the .NET 10 runtime components installed for local checks, even with a later SDK.

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
| Apply schema and seeds | The Microsoft Entra user configured as SQL administrator |
| Store the connection setting | Key Vault Secrets Officer on the lab vault |
| Run the application | User-assigned identity with restricted vault/table permissions |

Contributor alone cannot assign roles. This template expects a signed-in Microsoft Entra **user**, not a service principal or group administrator.

Keep administrator credentials and tokens out of files, chat, snapshots, and logs.

## Prepare the application explicitly

Start from your saved local checkpoint. Identify the learner project:

```powershell
$project = (Resolve-Path "shared-legacy-app\src\BookCatalog.Web\BookCatalog.Web.csproj" -ErrorAction Stop).Path
```

In Visual Studio, open `shared-legacy-app\BookCatalog.sln`. In Copilot Chat, ask the modernization agent to execute only the approved application-preparation group:

```text
@Modernize Prepare my learner application for the reviewed Azure plan.
Add Key Vault configuration using the user-assigned managed identity.
Keep local operation independent of Azure when KeyVaultName is absent.
Guard local schema initialization and disable it for Azure.
Add design-time schema generation without a live database connection.
Include the reviewed seed base in the generated schema SQL.
Use BookCatalogModernizedLab for local demo data.
EF Core may rebuild and seed the demo database when needed, not on every startup.
Keep saved edits across an ordinary app restart.
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

Rebuild and run locally as in Chapter 03. Add a book, edit it, restart the app, and confirm the saved edit remains.

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

Compare the generated `Books` columns with your EF Core `Book` model. Check required fields, string lengths, and the primary key.

Check that the SQL includes the reviewed seed inserts. A runtime-only seed method isn't included by `dotnet ef dbcontext script`.

If inserts are missing, ask the agent to include fixed model seed data, then regenerate and review the SQL before proceeding.

Review existing runtime seeding too. Local restarts mustn't duplicate seed records or replace existing stored values.

Don't enable cloud startup initialization to compensate. The runtime identity won't have schema-change permissions.

The cloud lab starts with demo seed data. It doesn't need records from the legacy app.

## Review the infrastructure

Open [the supplied Bicep template](../examples/azure/main.bicep) and [helper guide](../examples/azure/README.md).

Bicep describes the Azure resources and their configuration. The supplied template bounds this lab and defines the outputs its helpers accept.

In Copilot Chat, ask the modernization agent:

```text
@Modernize Compare our cloud plan and proposed changes with examples\azure\main.bicep.
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

Explain why schema preparation uses your approved administrator identity instead.

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

The supplied Node helper prepares an empty database using your reviewed schema and seed SQL. It grants runtime permissions but doesn't copy local records.

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

Successful bootstrap reports that schema, runtime identity, and Key Vault configuration are ready. Continue with publishing.

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

Open `$outputs.appUrl.value`. Confirm that the seeded catalog loads.

Create a **new disposable cloud book** with valid sample values and **Active** selected. Save its actual ID and details path.

Edit that record and confirm the saved values. Check active filtering and title order.

Use the cloud URL for these requests.

Restart the application before deleting that record:

```powershell
az webapp restart --subscription $outputs.subscriptionId.value --resource-group $group --name $outputs.appName.value
if ($LASTEXITCODE -ne 0) { throw "Application restart failed." }
```

Check the disposable book's saved values after restart.

Clear **Active**, save, and confirm it leaves the list while its details route still works. Restore **Active** and check title order.

If you want deeper validation, use the [optional advanced checks](../docs/advanced-checks.md) against the cloud app.

Keep the disposable record until any optional timestamp check below is finished. Otherwise, skip to [finish the app checks](#finish-the-app-checks).

HTTP 200 alone doesn't establish database writes or persistence. Confirm the edited values through the app after restart.

For a startup failure, inspect App Service logs. Check identity binding, vault role, secret name, SQL user, and schema separately.

Do not grant broad runtime permissions to hide an administrator setup error.

### Verify stored values after restart

**Optional advanced check.** This checks the disposable book's stored creation time. It doesn't require a snapshot.

Reopen only the narrow client rule for this check. The client needs approved outbound TCP port 1433.

The pause in this block keeps client access open for SQL Server Object Explorer. Connect to `$outputs.sqlServerFqdn.value` with the approved administrator.

Select `BookCatalogLab`. Use the [read-only creation-time query](../docs/advanced-checks.md#check-stored-creation-time) with your cloud disposable ID.

Record its stored `CreatedDate`, edit that record through the website, and query again. After comparing the values, return to PowerShell and press Enter.

```powershell
$verifyRule = "workshop-verify-$([guid]::NewGuid().ToString('N'))"
try {
    az sql server firewall-rule create --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value `
      --name $verifyRule --start-ip-address $clientIp --end-ip-address $clientIp -o none
    if ($LASTEXITCODE -ne 0) { throw "Verification firewall rule creation failed." }
    Read-Host "Check throwaway CreatedDate before and after a web edit. Press Enter when done" | Out-Null
}
finally {
    az sql server firewall-rule delete --subscription $outputs.subscriptionId.value --resource-group $group --server $outputs.sqlServerName.value --name $verifyRule -o none
    if ($LASTEXITCODE -ne 0) { throw "Client rule cleanup failed. Inspect and remove only this rule: $verifyRule" }
}
```

A date-only details page doesn't establish timestamp preservation. Compare the actual stored values and keep an unrun check distinct from a pass.

### Finish the app checks

Delete the disposable book through the website. Confirm its details route returns HTTP 404.

Ask the agent to reconcile the cloud plan's progress with your observations and unresolved failures. Optional checks you skipped aren't passing results.

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

Cloud cleanup removes the dedicated Azure group. It doesn't operate on local files or databases.

Record cleanup as passed only after confirming resource-group removal. Record failed or unrun application checks separately.

<a id="copy-the-same-selected-records"></a>
<a id="verify-original-records-after-restart"></a>
## Standalone data-transfer reference

For a separate import exercise, use [data transfer](../docs/data-transfer.md#optional-azure-copy). Import and snapshot verification aren't part of this deployment procedure.

**[Return to Azure planning](README.md)** · **[Course overview](../README.md)**

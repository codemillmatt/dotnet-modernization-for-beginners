# Azure lab support files

Use these files with the [optional deployment lab](../../04-cloud/deployment.md), after completing the required [Azure assessment and plan](../../04-cloud/README.md).

Do not deploy without separate access, scope, and cost approval. The lab exposes a public sample application without user authentication.

| File or tool | Responsibility |
| --- | --- |
| `main.bicep` | Define App Service, Azure SQL, Key Vault, a user-assigned identity, and deployment outputs |
| `lab.mjs` | Prepare schema, grant runtime table permissions, store the connection setting, and remove the dedicated group |
| `tools\BookCatalog.Data` | Separately preview, copy, and compare selected BookCatalog records |

The Node helper does not transfer records. Creating schema and seeds is separate from copying the learner's selected records.

## Helper inputs

Run `lab.mjs` from the repository root with Node 24 or a compatible version supported by `package.json`.

Check existing dependencies with `npm ls --depth=0`. Use `npm ci` if required dependencies are missing, or after an approved dependency-manifest change.

The `bootstrap` command takes reviewed deployment outputs, your public IPv4 address, and SQL generated from your learner application.

Set `$clientIp` through the deployment procedure before running:

```powershell
node examples\azure\lab.mjs bootstrap .azure-lab\outputs.json $clientIp .azure-lab\schema.sql
if ($LASTEXITCODE -ne 0) { throw "Database bootstrap failed." }
```

The helper checks the selected subscription. It creates a temporary firewall rule for exactly that IPv4 address.

It connects through your Azure CLI identity. That identity must be the Microsoft Entra user configured as SQL administrator.

For an empty database, it applies schema transactionally and records a fingerprint. Later runs must use that same schema.

It refuses an existing database without its marker. It does not migrate an existing schema.

The runtime identity receives access to `dbo.Books`, not schema permissions. The helper stores a passwordless connection setting in Key Vault.

The helper closes its SQL connection and removes its temporary firewall rule after success or failure. It reports cleanup failures as errors.

If cleanup fails, inspect the server's rules. Remove only the `workshop-` rule from that run, not another learner's rule.

## Copy selected records

Use the .NET helper's `--azure-outputs .azure-lab\outputs.json` option instead of local `--target-config`.

The original `.bookcatalog-lab\books.json` remains the comparison source. Keep its IDs, field values, SQL nulls, active state, and stored timestamps unchanged.

An import without `--apply` previews only. Apply and verify are separate actions.

Bootstrap removes its temporary client rule. Follow the [bounded client-access procedure](../../04-cloud/deployment.md#copy-the-same-selected-records) for cloud record operations.

The approved CLI administrator performs the copy, not the app's managed identity. Never increase runtime permissions to make a migration operation work.

See the [data helper guide](../../tools/BookCatalog.Data/README.md) for destination validation, conflict handling, and snapshot boundaries.

## Retry behavior

Inspect identity and role errors before retrying. Propagation delays can occur, but a fixed wait does not guarantee readiness.

Retry bootstrap with the same reviewed schema. A different fingerprint requires investigation, not database deletion.

For selected-record import, an exact repeat must not duplicate matching rows. Conflicting values must stop the copy rather than overwrite them.

## Cleanup

> This command deletes every resource in the dedicated lab group. Inspect the outputs file and resource ownership first.

```powershell
node examples\azure\lab.mjs cleanup .azure-lab\outputs.json --confirm-delete
if ($LASTEXITCODE -ne 0) { throw "Cleanup is not complete." }
```

The helper checks the subscription and workshop tag. It waits for deletion and checks that the exact group no longer exists.

Key Vault can retain recoverable metadata after group deletion. The helper does not purge it.

Keep the local databases and source snapshot. Cloud cleanup does not own them.

## Limits

The template uses public endpoints and an Azure-services SQL firewall rule. That rule is broader than access from this application's identity.

SQL authentication and permissions still apply. Production needs separate reviews of networking, user authentication, monitoring, backup, and recovery.

Mocked tests do not establish live deployment, quota, identity propagation, record transfer, or cleanup success.

References: [SQL managed identities](https://learn.microsoft.com/azure/azure-sql/database/authentication-azure-ad-user-assigned-managed-identity), [Key Vault configuration](https://learn.microsoft.com/aspnet/core/security/key-vault-configuration), and [Azure role permissions](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/privileged).

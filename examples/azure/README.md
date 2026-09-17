# Azure lab support files

Use these files with [Chapter 04](../../04-cloud/README.md). Do not deploy them without the chapter's access and cost checks.

| File | Purpose |
| --- | --- |
| `main.bicep` | Define App Service, Azure SQL, Key Vault, and a managed identity |
| `lab.mjs` | Apply the reviewed schema, grant table permissions, store the connection setting, and clean the lab group |

## Helper inputs

Run the helper from the repository root with Node 24 and the dependencies from `npm ci`.

The `bootstrap` command takes deployment outputs, your public IPv4 address, and the SQL script from your modernized application.

```powershell
node examples/azure/lab.mjs bootstrap .azure-lab/outputs.json $clientIp .azure-lab/schema.sql
```

The helper checks the selected subscription. It creates a temporary firewall rule for exactly that IPv4 address.

The helper connects through your Azure CLI identity. That identity must be the SQL administrator from the template.

For an empty database, it applies the schema in a transaction and records a fingerprint. For subsequent runs, the fingerprint must match.

It refuses an existing database without its marker. It does not migrate an existing schema.

The runtime identity receives access to `dbo.Books`, not schema permissions. The helper stores a passwordless connection setting in Key Vault.

The helper closes the SQL connection and removes its temporary rule after success or failure. It reports cleanup failures as errors.

If cleanup fails, inspect the server's firewall rules. Remove only the `workshop-` rule from that run. Do not remove another learner's rule.

## Retry behavior

Wait for identity or Key Vault role changes to become available before a retry. Run the same bootstrap command with the same reviewed schema.

A different schema fingerprint requires investigation. Do not delete a database to bypass that check.

## Cleanup

> This command deletes every resource in the dedicated lab group. Inspect the outputs file before you authorize deletion.

```powershell
node examples/azure/lab.mjs cleanup .azure-lab/outputs.json --confirm-delete
```

The helper checks the group's workshop tag before deletion. It waits for deletion and checks that the exact group no longer exists.

Key Vault can retain recoverable metadata after group deletion. The helper does not purge it.

## Limits

This lab uses public endpoints and an Azure-services SQL firewall rule. That rule is broader than access from this application's identity.

SQL authentication and database permissions still apply. For production, assess private networking, user authentication, monitoring, backup, and recovery requirements.

Offline tests use mocked Azure commands. They do not establish live deployment, quota, identity propagation, or cleanup success.

References: [managed identities for SQL](https://learn.microsoft.com/azure/azure-sql/database/authentication-azure-ad-user-assigned-managed-identity), [Key Vault configuration](https://learn.microsoft.com/aspnet/core/security/key-vault-configuration), and [Azure role permissions](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/privileged).

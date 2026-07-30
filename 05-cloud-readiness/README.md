# Chapter 05: Cloud readiness and architecture decisions

## Outcomes

You will:

- make hosting, identity, IaC, region, SKU, networking, and operations choices;
- prepare configuration and database lifecycle without runtime DDL privileges;
- inspect and compile parameterized Bicep;
- distinguish the economical learning architecture from production readiness.

## State contract

- **Start:** Independently validated modernized application.
- **End:** Reviewed cloud-ready overlay and architecture decision record; no
  Azure resources required yet.
- **Known-good end:** `checkpoints/05-cloud-ready`.
- **Verify:** App tests pass, Bicep compiles, PowerShell parses, and no live
  identifiers or credentials exist in source.
- **Reset/resume:** Start with `-Checkpoint 04-validated`; inspect the overlay
  with `-Checkpoint 05-cloud-ready`.
- **If output differs:** Generated infrastructure may vary. Compare security,
  data, operations, policy, and validation outcomes.

## 1. Explain: cloud readiness is application work

LocalDB, local configuration, runtime schema creation, and an interactive
developer identity are not deployment architecture. The cloud-ready checkpoint:

- reads the connection through standard configuration;
- disables migration and seed-on-startup in Production;
- checks in EF Core migrations;
- applies schema with a separate Microsoft Entra deployment identity;
- grants the runtime managed identity only database read/write roles;
- exposes a health endpoint;
- supplies parameterized Bicep, behavior validation, and cleanup.

## 2. Predict: choose before generating

Copy `../templates/cloud-architecture-decision.md`. Decide:

- App Service or Container Apps;
- system-assigned or user-assigned identity;
- Key Vault reference or an established enterprise configuration system;
- Bicep, `azd`, or existing enterprise IaC;
- region, SKU, scaling, networking, availability, and policy;
- Application Insights, logs, alerts, health, backups, and deployment slots;
- schema/data migration, deployment identity, reconciliation, and rollback;
- CI/CD rather than a permanent local-operator process.

App Service and system-assigned identity fit this small lab. They are not
universal defaults.

## 3. Perform: assemble and inspect

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 05-cloud-ready
Set-Location .\work
dotnet tool restore
dotnet test .\BookCatalog.slnx --configuration Release
az bicep build --file .\infra\main.bicep
```

Read every Bicep resource and output. Confirm all names, region, SKUs, settings,
URLs, and identities are parameters or derived values. Confirm no subscription,
tenant, object ID, email, password, token, local path, or recorded deployment
name is checked in.

Run a preview only when ready for Azure:

```powershell
az deployment group what-if `
  --resource-group <sandbox-resource-group> `
  --parameters .\infra\main.bicepparam
```

Supply real values only through your local environment or interactive script.
Never publish the preview output as an unreviewed screenshot.

## 4. Inspect: security and data model

The Bicep still requires a secure SQL bootstrap administrator password during
logical-server provisioning. The application never receives that password.
Its runtime connection uses Microsoft Entra authentication and is referenced
through Key Vault.

The runtime identity gets `db_datareader` and `db_datawriter`, not
`db_ddladmin` or `db_owner`. A deployment identity applies reviewed EF Core
migrations before application deployment. For existing data, the plan must
include backup, restore test, migration sequencing, reconciliation, and
rollback/roll-forward criteria.

Read [lab versus production](../docs/PRODUCTION-READINESS.md) and evaluate all
five Azure Well-Architected pillars.

## 5. Validate independently

- Build Bicep and inspect analyzer results.
- Parse every PowerShell script without executing it.
- Review `what-if` for creates, updates, and deletes.
- Confirm role-assignment deployment permissions; Contributor alone is not
  enough.
- Verify current price, region capacity, SKU availability, policy, and quota.
- Threat-model public endpoints and define production private networking.
- Record production gaps explicitly in the architecture decision.

## 6. Troubleshoot a variation

Choose one constraint—Container Apps, user-assigned identity, enterprise IaC,
private endpoints, or a restricted region. Ask the agent to revise the
architecture. Reject changes that bypass policy or broaden runtime privilege.
Explain how validation and rollback change.

## 7. Transfer

Create a cloud-readiness gap list for another stateful application. Include
authentication, external services, data gravity, resiliency, observability, and
delivery ownership.

## 8. Knowledge check and reflection

1. Why does managed runtime identity not eliminate every provisioning password?
2. Why should runtime identity lack DDL roles?
3. When is user-assigned identity preferable?
4. Which Well-Architected gap is most important for your workload?

**Learner artifact:** Reviewed cloud architecture decision record.

Continue to [Chapter 06: Azure deployment](../06-azure-deployment/README.md).

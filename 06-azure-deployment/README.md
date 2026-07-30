# Chapter 06: Azure deployment, operations, rollback, and cleanup

This hands-on stage provisions a sandbox. It does not promise identical
failures, regions, SKUs, costs, or generated infrastructure.

## Outcomes

You will:

- review `what-if` before provisioning;
- apply schema with a deployment identity and grant least-privilege runtime
  access;
- deploy and test behavior and persistence, not only availability;
- record operations, rollback, cleanup, and production gaps.

## State contract

- **Start:** Approved cloud architecture record and cloud-ready checkpoint.
- **End:** Behavior-validated sandbox deployment, evidence record, and deleted
  resource group.
- **Known-good evidence shape:** `checkpoints/06-azure`.
- **Verify:** Bicep deployment succeeds; migration and runtime roles are correct;
  behavior/persistence script passes; cleanup is confirmed.
- **Reset/resume:** `.\scripts\Reset-Course.ps1 -Checkpoint 06-azure`.
- **If output differs:** Follow tenant policy and conditional troubleshooting;
  never force the recorded architecture into an incompatible environment.

## 1. Explain: deployment gates

Provisioning is allowed only after:

- current pricing, budget, policy, quota, region, and SKU review;
- Contributor plus role-assignment permission;
- Microsoft Entra/Azure SQL administration permission;
- Bicep build and human `what-if` review;
- application tests, migration review, and existing-data backup/restore evidence.

Run:

```powershell
.\scripts\Test-Prerequisites.ps1 -IncludeAzure
.\scripts\Reset-Course.ps1 -Checkpoint 06-azure
Set-Location .\work
```

## 2. Predict: record expected changes

Before deployment, list expected resources, role assignments, public endpoints,
estimated cost, migration, runtime grants, and cleanup scope. Any unexpected
delete or privilege expansion in `what-if` is a stop condition.

## 3. Perform: provision and deploy

Use synthetic, non-identifying names. The script prompts for a new bootstrap
password and keeps it out of source:

```powershell
.\scripts\Deploy-Lab.ps1 `
  -SubscriptionId <sandbox-subscription-id> `
  -NamePrefix <unique-lowercase-prefix> `
  -ResourceGroup <new-sandbox-resource-group> `
  -Location <approved-region> `
  -EntraAdministratorLogin <approved-admin-display-name> `
  -EntraAdministratorObjectId <approved-admin-object-id>
```

Read the script before approval. It:

1. selects the sandbox subscription and creates the resource group;
2. runs `what-if` and pauses for PowerShell confirmation;
3. provisions parameterized Bicep;
4. runs the local build and behavior suite;
5. applies the checked-in migration with Microsoft Entra authentication;
6. creates the runtime database user with reader/writer roles only;
7. publishes and deploys the application;
8. runs HTTP, anti-forgery, CRUD, and cross-session persistence validation.

Generated infrastructure must still receive your own policy and architecture
review.

## 4. Inspect: application, data, and operations

Record:

- migration name and reviewed SQL;
- deployment and runtime identities by role—not their IDs in published material;
- database role query showing no runtime DDL role;
- index, health, token, create, and independent-session persistence results;
- Application Insights telemetry without PII;
- alerts, backup/restore, scaling, availability, and deployment-slot gaps.

For production, use CI/CD with federated identity, protected environments,
approvals, artifact provenance, `what-if`, migration gates, behavior tests, and
slot or revision rollback where supported.

## 5. Validate rollback and cleanup

Application rollback and schema rollback are different. Prefer compatible
expand/contract migrations and roll forward when destructive down-migration
would lose data. Rehearse restoring the prior application artifact and the
database backup in a non-production environment.

After evidence is complete:

```powershell
.\scripts\Remove-Lab.ps1 `
  -SubscriptionId <sandbox-subscription-id> `
  -ResourceGroup <sandbox-resource-group>

az group exists --name <sandbox-resource-group>
```

Expect `false`. Recheck cost management for delayed charges.

## 6. Conditional troubleshooting

| Condition | Safe response |
|---|---|
| Role assignment denied | Stop; request RBAC Administrator/User Access Administrator at the narrow scope |
| SQL Entra user creation fails | Verify approved Entra admin and logical-server directory permissions; do not fall back to runtime SQL admin |
| Region/SKU unavailable | Select a policy-compliant available option, update ADR/cost, rerun `what-if` |
| Key Vault reference is unresolved | Verify identity role assignment and propagation; do not paste the value into source |
| Migration fails | Stop deployment, preserve logs, restore or roll forward per reviewed plan |
| Behavior test fails after 200/health | Treat deployment as failed; investigate data/configuration before retry |
| Policy blocks public endpoints | Use the organization's network pattern; do not disable policy |

## 7. Transfer

Design a CI/CD gate sequence for your application. Identify separate application,
infrastructure, schema, data, security, and operations approvers.

## 8. Knowledge check and reflection

1. Why is `what-if` necessary but insufficient?
2. Why does the cloud test create and re-read data in a new session?
3. When is roll-forward safer than down-migration?
4. Which lab compromise must be removed first for your production workload?

**Learner artifact:** Deployment evidence, architecture record update, rollback
record, and cleanup proof using the synthetic template in `checkpoints/06-azure`.

Continue to [Chapter 07: Independent capstone](../07-capstone/README.md).

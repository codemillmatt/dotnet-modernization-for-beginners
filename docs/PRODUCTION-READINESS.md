---
title: Lab versus production
parent: Reference
nav_order: 8
permalink: /reference/production-readiness/
---

# Lab architecture versus production

The checked-in Bicep is reproducible learning infrastructure, not a production
reference architecture.

| Well-Architected concern | Lab choice | Production decision still required |
|---|---|---|
| Reliability | One region; economical App Service and SQL SKUs | Availability targets, zones/regions, capacity, retries, backup and restore tests |
| Security | HTTPS, managed runtime identity, Key Vault reference, minimum SQL roles | Private endpoints, egress controls, Defender, key rotation, break-glass access, policy |
| Cost optimization | Parameterized SKU and cleanup script | Current price estimate, budget, reservations, scale rules, retention |
| Operational excellence | Health endpoint and Application Insights resource | Dashboards, actionable alerts, runbooks, CI/CD approvals, deployment slots |
| Performance efficiency | No load target | Load profile, autoscale, database sizing, query analysis, cache strategy |

## Identity and database lifecycle

- Azure SQL logical-server provisioning still uses a secure bootstrap
  administrator password in this lab. The application never receives it.
- The app's connection string uses Microsoft Entra authentication and contains no
  database password. It is stored in Key Vault to demonstrate configuration
  references, not because the server name itself is a secret.
- A deployment identity applies checked-in EF Core migrations. The runtime
  identity receives `db_datareader` and `db_datawriter`, not `db_ddladmin` or
  `db_owner`.
- Do not run `EnsureCreated()` or automatic schema changes in production.
- Back up existing data, rehearse restore, review generated SQL, define
  expand/contract sequencing, and establish a rollback or roll-forward decision
  before migration.

For existing databases, inventory size, downtime tolerance, collation, identity
values, constraints, and data quality. Reconcile row counts and business totals
after migration; an HTTP 200 response is not data validation.

## Hosting and delivery decisions

Choose App Service for straightforward managed web hosting. Consider Container
Apps for container-native revision and event-driven requirements. Choose
system-assigned identity for a resource-bound lifecycle and user-assigned
identity when identity reuse or pre-authorization is required.

Use Bicep when Azure-native declarative infrastructure fits the organization;
use `azd` or existing enterprise IaC when that is the established delivery
system. Generated infrastructure must be reviewed regardless of tool.

Prefer CI/CD with federated workload identity, environment approvals, `what-if`,
artifact provenance, migration gates, smoke and behavior tests, and slot-based
rollback where the selected SKU supports slots.

Review all five pillars in the
[Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/).

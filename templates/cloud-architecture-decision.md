---
title: Cloud architecture decision record
parent: Templates
nav_order: 5
permalink: /templates/cloud-architecture-decision/
---

# Cloud architecture decision record

Write this while you review what the agent generated, not after you deploy.

- **Context and constraints:** *Example: internal catalog app, ~200 users, one region, no
  compliance requirements beyond company policy. Must not hold any credential in
  configuration.*
- **Hosting choice:** App Service / Container Apps / other
  — *Example: App Service. No container tooling in the team, no event-driven scaling need.*
- **Identity choice:** system-assigned / user-assigned
  — *Example: system-assigned. One app, one identity, lifecycle bound to the resource.*
- **Configuration and Key Vault choice:** *Example: Key Vault reference from App Service
  configuration; the app reads settings through the options pattern and never sees a
  secret.*
- **IaC and delivery choice:** Bicep / `azd` / enterprise platform
- **Region, SKU, scale, networking, and availability:**
- **Schema and data migration identity/process:** *Example: deployment identity applies
  migrations; runtime identity gets `db_datareader` and `db_datawriter` only.*
- **Health, logging, Application Insights, alerts, backups, and slots:**
- **Cost evidence and cleanup owner:**
- **Production-readiness gaps accepted:** *Example: public endpoints, no private endpoint,
  no alerting, no load test. Acceptable for a lab; all four block production.*

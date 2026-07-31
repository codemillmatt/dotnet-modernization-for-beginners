---
title: "05 · Migrating to Azure"
nav_order: 7
permalink: /azure-migration/
---

# 05 · Migrating to Azure

By the end of this chapter you'll have run predefined Azure migration tasks against your
upgraded app and reviewed the code and infrastructure the agent generated.

**Time: ~60 minutes** · **You need:** BookCatalog running on .NET 10 from Chapter 03

## What you'll do

- Switch to a different agent surface and understand what changed
- Run the Azure assessment and read its report
- Run two predefined tasks: managed identity for SQL, and Key Vault for secrets
- Review what the agent generated before anything reaches Azure

## You are now in a different tool

This is the most important paragraph in the chapter.

The .NET version upgrade agent and the Azure migration agent share a menu and a brand, but
they are separate. Almost everything you learned about *where things live* changes here.

| Aspect | .NET version upgrade | Azure migration |
|---|---|---|
| Entry point | **Modernize** / `@Modernize` | **Migrate to Azure** |
| State folder | `.github/upgrades/scenarios/{scenarioId}/` | `.appmod/.migration/` |
| Artifacts | `assessment.md`, `plan.md`, `tasks.md`, `scenario-instructions.md` | `plan.md`, `progress.md` |
| Unit of work | Tasks the agent generates from your code | A catalog of predefined tasks you pick from |
| Question it answers | Does this run on .NET 10? | Does this run *well* in Azure? |

What carries over is the *shape*: assess, then plan, then execute, with review between.
What doesn't carry over is the file layout. If you go looking for `scenario-instructions.md`
here, you won't find it.
{: .warning }

## Before you start

You need an upgraded app. If you don't have one:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

You'll also want an Azure subscription you can create and delete resources in. You don't
deploy anything in this chapter — that's Chapter 06 — but the agent will generate
infrastructure code you'll want to read with real deployment in mind.

## Steps

### 1. Run the Azure assessment

Right-click the solution and choose **Migrate to Azure**.

The agent analyzes your code for things that behave differently in a managed cloud
environment: local file writes, connection strings with embedded credentials, in-process
session state, on-premises message brokers, local SMTP.

It produces an assessment report with a list of findings — and, next to each one, a
**Run Task** button.

![Placeholder for a screenshot of the Azure migration assessment report with Run Task buttons](../assets/img/placeholder.png)

### 2. Look at the task catalog

Unlike the upgrade agent, this one works from a fixed catalog of well-understood
migrations. There are ten:

| Task | What it changes |
|---|---|
| Managed identity for databases | SQL Database, SQL Managed Instance, or PostgreSQL — removes credentials from connection strings |
| Azure File Storage | Local file system reads and writes become Azure Files |
| Azure Blob Storage | Local file storage becomes blob storage |
| Microsoft Entra ID | Existing auth becomes Entra ID |
| Managed identity + Key Vault | Secrets move to Key Vault, accessed without credentials |
| Azure Service Bus | On-premises message queues become Service Bus |
| Azure Communication Services email | SMTP becomes Communication Services |
| Azure Event Hubs for Kafka | Kafka clients point at Event Hubs |
| OpenTelemetry | Adds distributed tracing and metrics |
| Azure Cache for Redis | In-process or on-prem caching becomes managed Redis |

Each task changes four things together: **dependencies**, **configuration**, **code**, and
**infrastructure as code**. That bundling is the point — a managed identity change that
updates your connection string but not your Bicep leaves you with an app that can't
authenticate.

Full details for each task are in the
[predefined tasks documentation](https://learn.microsoft.com/dotnet/azure/migration/appmod/predefined-tasks).

### 3. Run the managed identity task

BookCatalog connects to LocalDB with a connection string. In Azure that becomes a SQL
Database, and the interesting question is how the app authenticates to it.

Click **Run Task** on the managed identity finding, or ask directly:

```text
Migrate my SQL Server connection to use managed identity.
```

Watch what it touches:

- **Dependencies** — adds `Azure.Identity` and the relevant SQL client packages
- **Configuration** — rewrites the connection string to drop the credential and use
  `Authentication=Active Directory Default`
- **Code** — wires up `DefaultAzureCredential` where it's needed
- **Infrastructure** — generates Bicep for the SQL server, the database, and a role
  assignment granting the app's identity access

Read the generated Bicep before you accept it. You're checking that the role assignment
grants what the app actually needs and no more.

### 4. Run the Key Vault task

```text
Move my application secrets to Azure Key Vault using managed identity.
```

Same four-part shape: Key Vault SDK packages, configuration provider registration, code
changes at the secret-read sites, and Bicep for the vault plus an access policy or RBAC
assignment.

The two tasks compose. After both, your app has no credentials in configuration at all —
it authenticates to SQL and to Key Vault with the same managed identity. That's the
outcome worth aiming at, and it's a genuinely hard thing to hand-write correctly.

### 5. Review before you accept

Go through the generated changes with the same discipline you used on `plan.md`:

- **Is the identity least-privilege?** A role assignment that grants Owner is a finding,
  not a feature.
- **Is anything still reading a secret from configuration?** Search for leftover
  connection strings and keys.
- **Does the Bicep name resources predictably?** You'll be deleting these later.
- **Do the tests still pass?** Some will need the credential path stubbed.

Record the decisions in the
[cloud architecture decision template](../templates/cloud-architecture-decision.md).

### 6. Read `progress.md`

The migration agent tracks its work in `.appmod/.migration/progress.md`. It's the
equivalent of `tasks.md` from the upgrade agent: a record of what ran, what succeeded, and
what needs your attention.

## What just happened

You used a catalog instead of a plan.

The upgrade agent generates tasks from your code because every legacy codebase is
differently legacy. The migration agent picks from ten predefined tasks because "put your
secrets in Key Vault" has one right answer, and encoding that answer once is better than
re-deriving it per customer.

Both still follow assess → review → execute. The review step is where you earn your keep:
generated infrastructure is easy to accept and expensive to un-accept.

## Try changing it

Run a task standalone, without going through the assessment report:

```text
Migrate from RabbitMQ to Azure Service Bus.
```

BookCatalog has no message queue, so the agent will tell you there's nothing to migrate.
That's a useful thing to see — the tasks are real capabilities you can invoke against any
codebase, not just menu items generated from one report.

BookCatalog only meaningfully exercises the database and Key Vault tasks. The storage,
messaging, and email tasks need code that does file I/O, queueing, or SMTP. When you get
to [Chapter 07](../07-your-own-app/README.md), your own app probably has some of those.
{: .note }

## If something goes wrong

| Problem | What to do |
|---|---|
| **Migrate to Azure** isn't in the menu | Same component check as Chapter 00 — the app modernization component must be installed |
| The assessment finds nothing | Confirm you're pointed at the upgraded solution, not the .NET Framework version |
| Generated Bicep won't compile | `az bicep build --file infra/main.bicep` gives you a real error message |
| The app can't authenticate locally | `DefaultAzureCredential` falls back to your signed-in Azure CLI identity. Run `az login` |

## Check yourself

1. Where does the Azure migration agent store its state, and why isn't it
   `.github/upgrades/`?
2. Name the four things a predefined task changes together.
3. Why is a fixed catalog the right design for cloud migration but the wrong design for a
   version upgrade?

---

Next → [Chapter 06: Deploy and validate](../06-deploy-and-validate/README.md)

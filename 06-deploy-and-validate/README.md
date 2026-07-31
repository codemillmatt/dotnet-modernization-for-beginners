---
title: "06 · Deploy and validate"
nav_order: 8
permalink: /deploy-and-validate/
---

# 06 · Deploy and validate

By the end of this chapter you'll have deployed the agent's output to a sandbox
subscription, proved the app works there, and deleted everything.

**Time: ~45 minutes** · **You need:** an Azure subscription you can create and delete
resources in

## What you'll do

- Review generated infrastructure code before it runs
- Deploy to a throwaway resource group
- Prove the app works with no credentials in configuration
- Delete it all and verify the deletion

Deploy to a sandbox or personal subscription only. Never run this against anything shared
or production-adjacent.
{: .warning }

## Before you start

If you don't have generated infrastructure from Chapter 05, use the reference version:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 05-cloud-ready
Set-Location .\work
az login
az account show
```

You'll be working with:

```text
infra/main.bicep          the infrastructure
infra/main.bicepparam     the parameters
database/grant-runtime-access.sql
scripts/Deploy-Lab.ps1
scripts/Grant-DatabaseAccess.ps1
scripts/Test-DeployedBehavior.ps1
scripts/Remove-Lab.ps1
```

Whether this came from the agent or from the checkpoint, treat it identically: **read it
before you run it.**

## Steps

### 1. Review the infrastructure

Open `infra/main.bicep` and answer four questions.

**What resources am I creating?** You should be able to list them without guessing. For
BookCatalog: an App Service plan, a web app, a SQL server, a database, and a Key Vault.

**Does the app get an identity?** Look for a system-assigned managed identity on the web
app. That identity is what replaces every password in your configuration.

**Is access least-privilege?** A role assignment scoped to one database is fine. A role
assignment scoped to the subscription is a finding.

**What's still a secret?** Search the file and the parameters for anything that looks like
a credential. The correct answer is nothing.

Validate it compiles before you spend money:

```powershell
az bicep build --file .\infra\main.bicep
```

![Placeholder for a screenshot of main.bicep open with the managed identity block visible](../assets/img/placeholder.png)

### 2. Deploy

```powershell
.\scripts\Deploy-Lab.ps1
```

Use a resource group name you'll recognize as disposable and can find again in an hour.

Deployment takes a few minutes. While it runs, read
[lab versus production](../docs/PRODUCTION-READINESS.md) — the gap between what you're
about to deploy and what you'd actually ship is worth knowing before someone asks you.

### 3. Grant the app access to the database

A managed identity exists, but SQL doesn't know about it yet. That's the step people
forget, and it produces a login failure that looks like a networking problem.

```powershell
.\scripts\Grant-DatabaseAccess.ps1
```

The script runs `database/grant-runtime-access.sql`, which creates a contained database
user for the app's identity and grants it `db_datareader` and `db_datawriter` — not
`db_owner`.

Read the SQL. It's twelve lines and it's the clearest illustration in the course of what
managed identity actually means at the database level.
{: .tip }

### 4. Validate the deployment

```powershell
.\scripts\Test-DeployedBehavior.ps1
```

Then check it yourself against the same behavior your characterization tests cover:

- The catalog list returns the expected books
- Creating a book persists it
- Validation errors still behave the same way
- The app reads its configuration without any credential in it

If something fails, the deployed app's logs are where to look:

```powershell
az webapp log tail --name <app-name> --resource-group <rg-name>
```

Record what you observed in
[the change log template](../templates/change-log.md). Evidence beats memory.

### 5. Delete everything

```powershell
.\scripts\Remove-Lab.ps1
```

Then verify, because "I ran the delete script" and "the resources are gone" are different
claims:

```powershell
az group exists --name <rg-name>
```

You want `false`.

Deleting the resource group is the whole cleanup. That's precisely why you deployed into a
disposable one.
{: .note }

## What just happened

You closed the loop.

The agent generated infrastructure. You read it, deployed it, proved the app behaved the
same way in Azure as it did locally, and removed it. At no point did a password appear in
a configuration file — the managed identity did the authenticating.

That's the actual value of the Azure migration tasks. Not that they save typing, but that
they encode a security posture that's tedious to get right by hand and easy to get subtly
wrong.

## Try changing it

Break it deliberately, once:

Comment out the role assignment in `main.bicep`, redeploy, and hit the app. You'll get an
authentication failure that tells you very little. Now you know what that failure looks
like, and you'll recognize it in ten seconds instead of twenty minutes.

Then restore it, redeploy, and confirm it works.

## If something goes wrong

| Problem | What to do |
|---|---|
| Deployment fails on a name conflict | SQL server and Key Vault names are globally unique. Change the prefix in `main.bicepparam` |
| The app returns 500 | `az webapp log tail`. Usually the database grant step hasn't run |
| Login failed for the managed identity | Re-run `Grant-DatabaseAccess.ps1` and confirm it targeted the right database |
| `az bicep build` errors | Fix the template before deploying. Failing locally costs nothing |
| You can't delete the resource group | Check for resource locks, then delete from the portal |

More in [troubleshooting](../docs/TROUBLESHOOTING.md).

## Check yourself

1. What does the managed identity replace?
2. Why isn't creating the identity enough on its own for database access?
3. Name two things in this deployment you'd change before running it in production.

---

Next → [Chapter 07: Bring your own app](../07-your-own-app/README.md)

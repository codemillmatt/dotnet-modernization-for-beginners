---
title: Upgrade plan
parent: Templates
nav_order: 2
permalink: /templates/upgrade-plan/
---

# Customized upgrade plan

Use this to record what you changed about the agent's plan and why. The "why" column is
the part worth keeping.

## Constraints and decisions

- **Scope:** *Example: the BookCatalog.Web project. Nothing outside the solution.*
- **Target framework:** *Example: .NET 10. Not .NET 8 — we want the longest support
  runway.*
- **Upgrade strategy:** bottom-up / top-down / all-at-once
  — *Example: all-at-once. Single project, so there's no project ordering to stage; the
  sequencing decisions all live inside it.*
- **Framework and package choices:** *Example: stay on EF6 for this upgrade; EF Core is a
  separate project with its own test plan.*
- **Source-control policy:** *Example: agent commits after each task; one branch; no
  force-push.*
- **Coding conventions:** *Example: file-scoped namespaces, constructor injection,
  `Microsoft.Extensions.Logging`.*
- **Deferred work:** *Example: the admin-only delete flow is lower risk than the Index and
  Create paths; verify it last.*

## Dependency-aware sequence

| Task | Depends on | Scope | Acceptance criteria | Rollback gate | Owner/approval |
|---|---|---|---|---|---|
| *Example:* Migrate `packages.config` to `PackageReference` | — | `BookCatalog.Web` | Solution builds clean; transitive versions compared before and after | Any new build warning | You |
|  |  |  |  |  |  |

Anything you overrode belongs in `scenario-instructions.md` as well, so it survives the
plan being regenerated.
{: .tip }

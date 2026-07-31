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

- **Scope:** *Example: all three BookCatalog projects. Nothing outside the solution.*
- **Target framework:** *Example: .NET 10. Not .NET 8 — we want the longest support
  runway.*
- **Upgrade strategy:** bottom-up / top-down / all-at-once
  — *Example: bottom-up. `BookCatalog.Core` first so tests can run after one project moves.*
- **Framework and package choices:** *Example: stay on EF6 for this upgrade; EF Core is a
  separate project with its own test plan.*
- **Source-control policy:** *Example: agent commits after each task; one branch; no
  force-push.*
- **Coding conventions:** *Example: file-scoped namespaces, constructor injection,
  `Microsoft.Extensions.Logging`.*
- **Deferred work:** *Example: `LegacyReportController` is dead code and will be deleted
  separately, not ported.*

## Dependency-aware sequence

| Task | Depends on | Scope | Acceptance criteria | Rollback gate | Owner/approval |
|---|---|---|---|---|---|
| *Example:* Migrate `packages.config` to `PackageReference` | — | All three projects | Solution builds; 9/9 tests pass; transitive versions compared | Any test failure | You |
|  |  |  |  |  |  |

Anything you overrode belongs in `scenario-instructions.md` as well, so it survives the
plan being regenerated.
{: .tip }

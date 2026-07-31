---
title: Glossary
parent: Reference
nav_order: 10
permalink: /reference/glossary/
---

# Glossary

## The tooling

| Term | What it means |
|---|---|
| GitHub Copilot modernization | The brand covering two agents: .NET version upgrade, and Azure migration |
| Assessment | The first stage. Reads your code, writes findings, changes nothing |
| Planning | The second stage. Produces an ordered, reviewable task list |
| Execution | The third stage. Applies the plan one task at a time, validating each |
| Guided mode | The agent pauses at stage boundaries and asks before continuing |
| Automatic mode | The agent runs through without pausing. Say `pause` to switch back |
| Pre-initialization | The questions asked before assessment: target framework, branch strategy, flow mode |
| Scenario | The named workflow the agent matched to your solution. Names its state folder |
| Predefined task | One of the ten fixed Azure migrations the migration agent can perform |
| Custom skill | Reusable instructions for a specific transformation, resolved by location priority |

## The files

| File | What it is |
|---|---|
| `assessment.md` | The analysis. Editable — add context the agent can't see |
| `upgrade-options.md` | Your confirmed decisions, including the upgrade strategy |
| `plan.md` | The ordered task list. Editable |
| `scenario-instructions.md` | The agent's persistent memory, loaded on every interaction |
| `tasks.md` | Live progress dashboard. Read-only; the agent overwrites edits |
| `task.md` | One task's scope, under `tasks/{taskId}/`. Editable |
| `progress-details.md` | What the agent did and hit during a task. Where you debug |
| `progress.md` | The Azure migration agent's equivalent of `tasks.md` |

## Upgrade strategies

| Term | What it means |
|---|---|
| Bottom-up | Upgrade leaf dependencies first, work up toward the entry point. The usual default |
| Top-down | Start at the entry point and work down, tolerating stubs |
| All-at-once | Change everything, then fix the fallout |

## Compatibility

| Term | What it means |
|---|---|
| Source incompatibility | The source must change to compile against the target |
| Binary incompatibility | An existing compiled binary can't use the target API contract |
| Behavioral change | It compiles and runs, and does something different |
| Compatible API | Present on the target. Not proof that behavior is identical |

## Practice

| Term | What it means |
|---|---|
| Characterization test | A test that records current behavior so you can prove it didn't change |
| Checkpoint | A read-only known-good course state you can reset to |
| Acceptance gate | Evidence that must exist before you accept a task |
| Rollback gate | The condition that makes you revert instead of pressing on |
| EF migration | A versioned schema change generated and reviewed with EF Core |
| Managed identity | A Microsoft Entra identity whose credentials Azure manages, so you don't |
| `what-if` | An Azure preview of what a deployment would change |

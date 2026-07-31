---
title: Checkpoints
nav_order: 22
permalink: /checkpoints/
---

# Course checkpoints

Checkpoints are read-only reference states. They exist so that a bad hour doesn't cost you
the rest of the course.

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

The script copies the checkpoint into an ignored `work/` folder. It never writes over what
you've already done. Don't edit the checkpoint folders themselves.
{: .note }

| Checkpoint | Use it to start | What's in it | How to verify it |
|---|---|---|---|
| `legacy-baseline` | Chapter 00 | The untouched .NET Framework 4.8 BookCatalog solution | `msbuild` then `dotnet test` — 9 tests pass |
| `01-assessment` | Chapter 02 | A model assessment and worksheet | Trace each finding back to source |
| `02-planning` | Chapter 03 | Options, plan, and a customized comparison | Check ordering, acceptance, and rollback |
| `03-modernized` | Chapters 04 and 05 | The full .NET 10 application with tests and an EF migration | `dotnet build` and `dotnet test` |
| `04-validated` | Reference | A model validation evidence document | Reproduce every command it cites |
| `05-cloud-ready` | Chapter 06 | Bicep, migration identity, runtime grants, deploy and cleanup scripts | `az bicep build` and a PowerShell parse |
| `06-azure` | Reference | Sample deployment evidence and an architecture record | Replace the placeholders with your own evidence |
| `07-capstone` | Chapter 07 stretch track | The self-assessment rubric | Score against evidence you can cite |

If the agent picked a different scenario folder name than the default, pass it through:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 02-planning -ScenarioId my-scenario-name
```

Agent output varies. These artifacts show the level of quality and coverage to aim for,
not text you're supposed to reproduce. See
[when your output differs](../docs/OUTPUT-DIFFERS.md).

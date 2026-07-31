---
title: Course map
parent: Reference
nav_order: 11
permalink: /reference/course-map/
---

# Course map

Eight chapters, about five and three-quarter hours. You can stop after any of them.

| Chapter | You start with | You end with | Checkpoint |
|---|---|---|---|
| [00 Set up and first run](../00-setup/README.md) | A clone and a working Visual Studio | An assessment you generated and read | `legacy-baseline` |
| [01 Assessment](../01-assessment/README.md) | That assessment | A corrected assessment and a chosen strategy | `01-assessment` |
| [02 Planning](../02-planning/README.md) | A reviewed assessment | The default plan and your plan, diffed | `02-planning` |
| [03 Execution](../03-execution/README.md) | An approved plan | An app on .NET 10, one recovered failure, and tests you wrote yourself | `03-modernized`, `04-validated` |
| [04 Teaching the agent](../04-teaching-the-agent/README.md) | A running or finished upgrade | An instruction file containing your own diff | `03-modernized` |
| [05 Migrating to Azure](../05-azure-migration/README.md) | An upgraded app | Agent-generated Azure code and Bicep | `05-cloud-ready` |
| [06 Deploy and validate](../06-deploy-and-validate/README.md) | Generated infrastructure | A validated sandbox deployment, then deleted | `06-azure` |
| [07 Bring your own app](../07-your-own-app/README.md) | An app you care about | An assessment and a decision | `07-capstone` |

Reset to any checkpoint at any time:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

The script writes into the ignored `work/` folder. It never touches your own work. See
[checkpoint contents](../checkpoints/README.md).

## What the course covers

**Scenario:** ASP.NET MVC 5 and Entity Framework 6 on .NET Framework 4.8, upgraded to
.NET 10, then migrated to Azure App Service.

**Audience:** developers who know C#, ASP.NET, Git, and NuGet, and who have never run a
structured modernization workflow.

**Surface:** Visual Studio on Windows. A VS Code version is coming soon.

## What it doesn't cover

- Production certification. See [lab versus production](PRODUCTION-READINESS.md)
- Fixed effort or fixed Azure cost
- Byte-for-byte agent output. See [when your output differs](OUTPUT-DIFFERS.md)

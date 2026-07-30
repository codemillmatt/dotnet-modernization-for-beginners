# Course map

Every chapter uses the same loop: explain, predict, perform, inspect, validate,
troubleshoot, transfer, and reflect.

| Chapter | Start | Learner-produced output | Known-good end |
|---|---|---|---|
| 00 Orientation | Fresh clone and `00-introduction/code` | Baseline observation notes | `checkpoints/00-orientation` |
| 01 Assessment | `shared-legacy-app` on a clean branch | Assessment worksheet and risk register | `checkpoints/01-assessment` |
| 02 Customization and planning | Chapter 01 artifacts | Customized plan with acceptance and rollback gates | `checkpoints/02-planning` |
| 03 Upgrade execution | Approved plan and passing legacy tests | Reviewed change log with test evidence | `checkpoints/03-modernized` |
| 04 Behavioral validation | Modernized checkpoint | Equivalence evidence and deferred-risk list | `checkpoints/04-validated` |
| 05 Cloud readiness | Validated application | Cloud architecture decision record | `checkpoints/05-cloud-ready` |
| 06 Azure deployment | Reviewed cloud-ready overlay | Deployment evidence, rollback record, and cleanup proof | `checkpoints/06-azure` |
| 07 Independent capstone | Learner-selected application | Transfer plan and self-assessment | `checkpoints/07-capstone` |

## Course contract

- **Primary interface:** Visual Studio. Equivalent artifacts and checkpoints work
  with VS Code and GitHub Copilot CLI; see [cross-surface guidance](CROSS-SURFACE.md).
- **Supported scenario:** ASP.NET MVC 5 and EF6 to ASP.NET Core and EF Core on
  .NET 10, followed by an Azure App Service learning deployment.
- **Audience:** Developers who know C#, ASP.NET, Git, and NuGet but are new to a
  systematic modernization workflow.
- **Not promised:** Production certification, fixed effort, fixed Azure cost, or
  byte-for-byte agent output.

Run `scripts/Reset-Course.ps1` to resume from any checkpoint. The script writes
to ignored `work/`; immutable source checkpoints are never edited.

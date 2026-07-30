# Supported environment

**Last validated: 2026-07-30**

Versions and cloud availability change. Re-run the preflight before a workshop
and use the linked vendor pages as the source of truth.

| Requirement | Supported contract | Verify |
|---|---|---|
| Windows | A Windows release supported by the installed Visual Studio version | `winver`; compare with [Visual Studio system requirements](https://learn.microsoft.com/visualstudio/releases/2026/vs-system-requirements) |
| Visual Studio | Visual Studio 2026, or Visual Studio 2022 17.14.17 or later | **Help → About Microsoft Visual Studio** |
| Workloads | .NET desktop development and ASP.NET and web development | Visual Studio Installer → **Modify** |
| Optional components | GitHub Copilot and GitHub Copilot app modernization | Right-click a project and verify **Modernize** appears |
| Legacy targeting | .NET Framework 4.8 Developer Pack, IIS Express, SQL Server Express LocalDB | `msbuild -version`; `sqllocaldb info` |
| Modern target | Stable .NET 10 SDK, any installed 10.0 feature band accepted by `global.json` | `dotnet --list-sdks` and `dotnet --version` |
| Source control | Current Git | `git --version` |
| Cloud chapters | Current Azure CLI with Bicep and Microsoft SQL `sqlcmd` | `az version`; `az bicep version`; `sqlcmd -?` |
| Shell | Windows PowerShell 5.1 or PowerShell 7 | `$PSVersionTable.PSVersion` |

The official modernization install guidance lists Visual Studio 2026 or Visual
Studio 2022 17.14.17+, the .NET desktop workload, and both Copilot components:
[install GitHub Copilot modernization](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/install?pivots=visualstudio).

## SDK selection

The course pins the minimum .NET 10 SDK to `10.0.100` and uses
`"rollForward": "latestFeature"`. This accepts a later .NET 10 feature band,
unlike `latestPatch`, while refusing a different major release. See the
[`global.json` rules](https://learn.microsoft.com/dotnet/core/tools/global-json).

.NET 10 is stable; do not enable preview SDKs for this course.

## Azure authorization contract

The deploying identity needs all of the following:

1. Permission to create resources, normally **Contributor** at the lab resource
   group or subscription.
2. `Microsoft.Authorization/roleAssignments/write` to create the Key Vault role
   assignment, normally **Role Based Access Control Administrator** or **User
   Access Administrator**. Contributor alone is insufficient.
3. Permission to configure the Microsoft Entra administrator for Azure SQL.
4. Microsoft Entra and Azure SQL permissions needed to create the runtime
   database user. Some tenants require an administrator to grant the logical
   server identity directory-read permissions.

Use a sandbox subscription that permits these actions. Organizational policy may
block public endpoints, specific regions, or economical SKUs; do not weaken
policy to complete the lab.

## Preflight

From the repository root:

```powershell
.\scripts\Test-Prerequisites.ps1
.\scripts\Test-Prerequisites.ps1 -IncludeAzure
```

The first command validates local chapters. The second adds Azure CLI, Bicep,
`sqlcmd`, sign-in, and authorization reminders.

## Cost

Azure pricing and regional SKU availability are dynamic. The sample parameters
favor an inexpensive learning architecture but do not promise a price or free
tier. Estimate immediately before deployment with the
[Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/),
check the selected region, configure a budget, and delete the resource group
after validation.

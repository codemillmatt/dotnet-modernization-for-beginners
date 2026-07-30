# .NET Modernization for Beginners

Modernize a tested ASP.NET MVC 5 and EF6 application from .NET Framework 4.8
to ASP.NET Core and EF Core on .NET 10, then prepare and deploy a reviewed Azure
learning environment with GitHub Copilot modernization.

This is a beginner course **for developers already comfortable with C#,
ASP.NET, Git, and NuGet**. It teaches modernization decisions and evidence, not
just tool clicks.

## Outcomes

You will:

- assess compatibility without confusing category, severity, and priority;
- customize agent scope, sequencing, framework, data, and validation decisions;
- review generated artifacts, commands, code, dependencies, and infrastructure;
- preserve and prove CRUD, routing, validation, configuration, security, and
  data behavior;
- recover from divergent agent output with commits and immutable checkpoints;
- deploy reviewed Bicep with managed runtime identity and a separate schema
  migration identity;
- identify what the economical lab architecture still lacks for production;
- apply the workflow to an unfamiliar application.

## Start here

1. Read the [supported environment contract](docs/ENVIRONMENT.md).
2. Read the [safe human-in-the-loop workflow](docs/SAFE-WORKFLOW.md).
3. Clone the canonical repository and run preflight:

   ```powershell
   git clone https://github.com/codemillmatt/dotnet-modernization-for-beginners.git
   Set-Location dotnet-modernization-for-beginners
   .\scripts\Test-Prerequisites.ps1
   ```

4. Begin [Chapter 00](00-introduction/README.md).

Do not skip the baseline tests. Build success and an HTTP 200 response do not
prove equivalent behavior.

## Course

| Chapter | Active outcome | Learner artifact |
|---|---|---|
| 00 [Orientation and preflight](00-introduction/README.md) | Explain the workflow and establish baseline evidence | Baseline observation |
| 01 [Assessment](01-assessment/README.md) | Triage evidence across six dimensions | Assessment worksheet and risk register |
| 02 [Customization and planning](02-planning/README.md) | Defend a safer customized plan | Upgrade plan with gates |
| 03 [Upgrade execution](03-upgrade-execution/README.md) | Review, steer, validate, and roll back changes | Reviewed change log |
| 04 [Behavioral validation](04-behavioral-validation/README.md) | Prove application and data equivalence | Validation evidence |
| 05 [Cloud readiness](05-cloud-readiness/README.md) | Decide architecture, identity, data, and operations | Architecture decision record |
| 06 [Azure deployment](06-azure-deployment/README.md) | Provision, migrate, deploy, validate, roll back, and clean up | Deployment evidence |
| 07 [Independent capstone](07-capstone/README.md) | Transfer the method to another application | Transfer plan and rubric |

See the detailed [course map](docs/COURSE-MAP.md), [glossary](docs/GLOSSARY.md),
[cross-surface notes](docs/CROSS-SURFACE.md), and
[output-difference guide](docs/OUTPUT-DIFFERS.md).

## Reproducible states

The repository includes:

- the legacy baseline with a dependent project and characterization tests;
- representative assessment and planning artifacts;
- a buildable, tested .NET 10 checkpoint with EF Core migrations;
- a cloud-ready overlay with Bicep and deployment scripts;
- validation, architecture, deployment, and capstone model artifacts.

Checkpoints are immutable. Copy one to ignored `work/`:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

See [checkpoint contents and verification](checkpoints/README.md).

## Scope, cost, and support

The primary path uses Visual Studio on supported Windows. VS Code and Copilot CLI
produce the same durable artifacts but have different UI. .NET 10 is stable.
Supported .NET Framework releases remain serviced as Windows components; this
course modernizes for platform capabilities and lifecycle choices, not because
supported security fixes are “scarce.”

Azure resources can incur charges. Prices, quotas, policies, capacity, and SKU
availability vary. Estimate immediately before deployment, use a sandbox,
configure a budget, and run cleanup. The sample architecture is intentionally
not presented as production-ready.

## Official technical sources

- [GitHub Copilot modernization overview](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization-overview)
- [.NET porting guidance](https://learn.microsoft.com/dotnet/core/porting/)
- [ASP.NET MVC migration guidance](https://learn.microsoft.com/aspnet/core/migration/mvc)
- [EF6 to EF Core porting guidance](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)
- [Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/)
- [Bicep documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

## Help and contributions

- [Open an issue](https://github.com/codemillmatt/dotnet-modernization-for-beginners/issues)
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Review [SECURITY.md](SECURITY.md)

MIT licensed; see [LICENSE](LICENSE).

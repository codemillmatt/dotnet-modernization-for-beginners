# Technical interpretation guide

## Compatibility is not priority

Compatibility category describes the kind of change. Tool severity describes
the analyzer's confidence or consequence. Planning priority also depends on
business and runtime evidence.

| Compatibility category | Possible tool severity | Business criticality | Runtime exposure | Remediation confidence | Required validation |
|---|---|---|---|---|---|
| Binary incompatibility | Error, warning, or unknown | Low to critical | Load or deployment | Varies | Clean build plus load/deployment test |
| Source incompatibility | Error or warning | Low to critical | Compilation | Varies | Retargeted build plus focused behavior tests |
| Behavioral change | Any severity | Low to critical | Runtime only | Often low | Characterization, integration, performance, and failure-path tests |
| Compatible API | Informational or none | Low to critical | Runtime | Not proof of equivalence | Tests for business-critical behavior |

A source incompatibility can block compilation. A behavioral change can be the
highest business risk even when the tool labels it informational.

For every finding, record all six columns. Prioritize by evidence, not color or
count.

## Package decisions

“Compatible” only means a package can participate in the target graph; it does
not mean “keep it unchanged.” Assign one explicit disposition:

- **Keep** at a verified supported version.
- **Upgrade** to a verified target-framework version.
- **Framework-provided**: remove the old package because the new shared
  framework provides the replacement capability.
- **Replace** with a different package or platform API.
- **Defer** with an owner, risk, validation, and removal date.
- **Remove** because the capability is unused.

ASP.NET MVC 5 packages are not simply “rolled into” ASP.NET Core. The old
packages are removed and their concepts are migrated to a redesigned framework.

## Effort and risk

Finding counts and estimated changed lines are inventory signals, not schedules.
Estimate only after reviewing dependencies, test coverage, behavior exposure,
data migration, deployment constraints, team availability, and uncertainty.

Many MVC names have recognizable replacements, but routing, model binding,
filters, anti-forgery, configuration, session, error handling, and request
lifetime can change behavior. Treat representative diffs as architectural
changes that require tests.

## Platform support

Supported .NET Framework releases remain Windows components and continue to
receive servicing under the Windows lifecycle. The modernization rationale is
access to modern .NET features, performance, cross-platform hosting, current
libraries, and a clearer application lifecycle—not a claim that supported .NET
Framework security fixes have become scarce.

## EF6 and EF Core

EF Core is a rewrite, not an in-place EF6 upgrade. Keeping EF6 while moving to
modern .NET can be a lower-risk intermediate step. EF6 migration history is not
portable to EF Core; establish a reviewed baseline migration and validate query,
tracking, null, transaction, concurrency, and loading behavior. Follow the
[official EF porting guide](https://learn.microsoft.com/ef/efcore-and-ef6/porting/).

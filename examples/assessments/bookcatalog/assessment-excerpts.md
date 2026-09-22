# BookCatalog assessment excerpts

These excerpts come from the supplied September 21, 2026 assessment, not a new assessment run.
Each fenced block preserves the source text. Explanations outside the blocks are maintainer interpretation.

The supplied `assessment.md`, `assessment.csv`, and `assessment.json` match their later copies in `final-mod-agent-files` byte for byte.
The original files remain private. These selections omit the full incident inventory and local execution logs.

## One project, with a package-count discrepancy

Source: `assessment.md`, **Highlevel Metrics**.

```text
| Metric | Count | Status |
| :--- | :---: | :--- |
| Total Projects | 1 | All require upgrade |
| Total NuGet Packages | 0 | All compatible |
| Total Code Files | 14 |  |
| Total Code Files with Incidents | 7 |  |
| Total Lines of Code | 636 |  |
| Total Number of Issues | 108 |  |
| Estimated LOC to modify | 89+ | at least 14.0% of codebase |
```

The zero package count isn't a reliable inventory.
The same report lists seven package issues for the project.
The CSV contains seven package findings, including two for EntityFramework.

Source: `final-mod-agent-files\tasks\01-verify-migration-readiness\progress-details.md`, **Package and binding review**.

```text
- Confirmed six packages and reconciled all seven package findings; EF6 accounts for two findings. Full table is in task.md.
```

That readiness record reports six installed packages.
It doesn't say the application has no dependencies.

## The web framework needs migration

Source: `assessment.md`, **API Compatibility**.

```text
| Category | Count | Impact |
| :--- | :---: | :--- |
| 🔴 Binary Incompatible | 83 | High - Require code changes |
| 🟡 Source Incompatible | 6 | Medium - Needs re-compilation and potential conflicting API error fixing |
| 🔵 Behavioral change | 0 | Low - Behavioral changes that may require testing at runtime |
| ✅ Compatible | 249 |  |
| ***Total APIs Analyzed*** | ***338*** |  |
```

These are 89 incompatible API findings, not 89 separate manual fixes or a measured effort estimate.
The report groups them under `System.Web`.
They affect controllers, request access, startup, filters, and routing.

The JSON target is `net10.0`. The original project is non-SDK-style `net48`.
Some labels in the supplied dashboard's detailed view mention .NET 8.
We haven't corrected those screenshot pixels. Use the saved target fields to resolve that inconsistency.

## Review binding findings before changing configuration

Source: `final-mod-agent-files\tasks\01-verify-migration-readiness\progress-details.md`, **Package and binding review**.

```text
- Newtonsoft package 13.0.3 actually contains assembly 13.0.0.0, so its current redirect is correct. No MSB3836 observed. Other redirect targets match DLL metadata. EF assembly identity is 6.0.0.0; no verified need to add a redirect.
- No redirects removed or package versions changed.
```

The original report has three binding findings.
The later readiness work distinguishes package versions from assembly identities.
This is a useful reason to review an assessment, not a reason to edit every report.
Keeping the assessment unchanged is valid. Record a preference or correction separately when it's needed.

**[Recording and provenance](README.md)** · **[Planning excerpts](planning-excerpts.md)**

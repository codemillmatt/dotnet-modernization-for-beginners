# Model assessment: BookCatalog

This representative artifact covers the checked-in multi-project baseline.
Actual agent wording and counts vary.

## Scope

- `BookCatalog.Core` targets .NET Framework 4.8 and owns the validated model.
- `BookCatalog.Web` is a classic ASP.NET MVC 5 web application using `System.Web`.
- `BookCatalog.CharacterizationTests` records current behavior against LocalDB.

## Evidence-backed findings

| Finding | Compatibility category | Tool severity | Business/runtime risk | Required validation |
|---|---|---|---|---|
| Classic WAP project and `System.Web` startup | Source/binary architecture incompatibility | Blocking after retarget | Routing, filters, errors, request lifetime | HTTP routes, status codes, error paths |
| MVC controller and Razor APIs | Mixed source/binary incompatibility | Blocking after retarget | Binding, validation, anti-forgery, redirects | CRUD and security behavior tests |
| EF6 initializer and query | Behavioral and source change if ported to EF Core | High review priority | Schema, seed, ordering, tracking, null behavior | Database and query characterization tests |
| `web.config` connection string and settings | Source/configuration migration | Blocking for hosting | Wrong environment or secret exposure | Configuration loading tests per environment |
| .NET Framework model library and tests | Dependency-order constraint | Planning input | Web project cannot advance independently without a compatible dependency | Build every target at each gate |

## Package disposition

| Package family | Disposition | Reason |
|---|---|---|
| ASP.NET MVC 5/Razor/WebPages | Replace/remove | ASP.NET Core is a redesigned framework, not a version bump |
| EF6 | Decide: retain temporarily or port separately | EF6 can reduce simultaneous change; EF Core is a separate port |
| Newtonsoft.Json | Verify use, then keep/upgrade/replace/remove | Compatibility alone does not choose a disposition |

No schedule is inferred from finding count. Effort depends on behavior evidence,
data constraints, deployment policy, and remediation uncertainty.

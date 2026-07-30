# Model assessment worksheet

| Finding and evidence | Category | Tool severity | Criticality | Exposure | Confidence | Validation |
|---|---|---|---|---|---|---|
| `RouteConfig` default route | Source/architecture | Blocking | High | Every request | High | `/`, details, unknown route |
| `[ValidateAntiForgeryToken]` on writes | Behavioral/security | May not be surfaced | Critical | Authenticated write requests | Medium | POST with and without token |
| Active books ordered by title | Behavioral | Informational or absent | High | Index query | Medium | Seeded integration test |
| `DropCreateDatabaseIfModelChanges` | Behavioral/data | Warning | Critical with existing data | Startup/schema | High | Migration review, backup/restore, row reconciliation |

Potential false negative: generated reports can list MVC symbols without
identifying overposting or route-order behavior. Source review and tests add that
evidence.

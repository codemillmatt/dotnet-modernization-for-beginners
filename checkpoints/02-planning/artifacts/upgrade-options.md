# Confirmed upgrade options

| Decision | Selection | Rationale and constraint |
|---|---|---|
| Flow | Guided | Learner must inspect and steer every stage |
| Source control | Dedicated branch and per-task commits | Required rollback and review evidence |
| Solution scope | Core, Web, and tests | Excluding tests would remove equivalence evidence |
| Target | Stable .NET 10 | Course contract |
| Dependency strategy | Multi-target/upgrade dependency before web app | Preserve a buildable dependency path |
| Web migration | In place for the sample | Small surface; side-by-side remains valid for larger systems |
| EF strategy | Separate gate after ASP.NET Core behavior is stable | Avoid mixing framework and data behavior diagnosis |
| Validation | Same characterization contract at every execution gate | Build success alone is insufficient |
| Cloud | App Service, Bicep, managed runtime identity | Fits the learning architecture; production review remains required |

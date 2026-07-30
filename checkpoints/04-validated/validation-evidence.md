# Model validation evidence

Reproduce this evidence; do not copy the check marks without running commands.

| Contract | Evidence | Result |
|---|---|---|
| Release compilation | `dotnet build BookCatalog.slnx --configuration Release --no-restore` | Pass, 0 warnings/errors |
| Full behavior suite | `dotnet test BookCatalog.slnx --configuration Release --no-build` | 9 passed |
| CRUD and persistence | `CrudActionsPersistChanges` | Pass |
| Validation | `InvalidModelDoesNotCreateBook`; model validation test | Pass |
| Routing and response | Root and missing-details HTTP tests | 200 and 404 as expected |
| Database initialization | Seed count test | 7 total, 6 active |
| Configuration | Connection-string loading test | Pass |
| Anti-forgery | Tokenless POST and attribute test | 400; all write methods protected |
| EF query | Active and ordered index test | Pass |

## Remaining validation before production

- Run provider-realistic SQL tests, load and concurrency tests.
- Rehearse migration against a sanitized copy of existing data.
- Compare row counts and business totals; test backup restore.
- Validate authentication/authorization if added to the transfer application.

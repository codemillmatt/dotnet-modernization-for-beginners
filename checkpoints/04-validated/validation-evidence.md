# Model validation evidence

Reproduce this evidence; do not copy the check marks without running commands.

The suite this cites is in `tests/` beside this file. It is **not** agent output — it's
the worked solution to the Chapter 03 exercise, written by hand against the modernized
app. Write your own first.
{: .note }

Run it with:

```powershell
dotnet test .\BookCatalog.Validation.slnx --configuration Release
```

| Contract | Evidence | Result |
|---|---|---|
| Release compilation | `dotnet build ..\03-modernized\BookCatalog.slnx --configuration Release` | Pass, 0 warnings/errors |
| Full behavior suite | `dotnet test BookCatalog.Validation.slnx --configuration Release` | 10 passed; 9 provider-independent plus one SQL Server test |
| CRUD and persistence | `CrudActionsPersistChanges` | Pass |
| Validation | `InvalidModelDoesNotCreateBook`; model validation test | Pass |
| Routing and response | Root and missing-details HTTP tests | 200 and 404 as expected |
| Database initialization | Seed count test | 7 total, 6 active |
| Configuration | Connection-string loading test | Pass |
| Anti-forgery | Tokenless POST and attribute test | 400; all write methods protected |
| EF query | Active and ordered index test plus SQL Server LocalDB provider test | Pass |

## Remaining validation before production

- Run provider-realistic SQL tests, load and concurrency tests.
- Rehearse migration against a sanitized copy of existing data.
- Compare row counts and business totals; test backup restore.
- Validate authentication/authorization if added to the transfer application.

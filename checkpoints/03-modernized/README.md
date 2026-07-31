# Checkpoint 03: Modernized application

This immutable checkpoint is the known-good result after upgrade execution.

## Verify

```powershell
dotnet restore .\BookCatalog.slnx
dotnet build .\BookCatalog.slnx --configuration Release --no-restore
dotnet test .\BookCatalog.slnx --configuration Release --no-build
```

The tests cover the baseline contract: CRUD, validation, routing and responses,
database seed data, configuration, anti-forgery behavior, errors, and the active
book query. Windows runs also exercise the query and migration with SQL Server
LocalDB; cross-platform runs use the in-memory provider for fast behavior tests.

For local SQL Server testing, run the application once with the Development
environment. Development-only settings apply the checked-in EF Core migration
and seed data. Production deployments must apply migrations with a separate
deployment identity; the runtime identity does not need schema-change rights.

Use `scripts/Reset-Course.ps1 -Checkpoint 03-modernized` from the repository
root to copy this state into `work/`.

# Checkpoint 03: Modernized application

This immutable checkpoint is the known-good result after upgrade execution.

## Verify

```powershell
dotnet restore .\BookCatalog.slnx
dotnet build .\BookCatalog.slnx --configuration Release --no-restore
dotnet run --project .\src\BookCatalog.Web
```

Like the legacy sample it came from, this checkpoint is a **single project and
ships no tests**. It's what the agent produces, and the agent does not write
tests. Verifying it means building it and exercising it.

The worked test suite lives in `checkpoints/04-validated/tests/` instead,
because you write those — see the exercise at the end of Chapter 03.

For local SQL Server testing, run the application once with the Development
environment. Development-only settings apply the checked-in EF Core migration
and seed data. Production deployments must apply migrations with a separate
deployment identity; the runtime identity does not need schema-change rights.

Use `scripts/Reset-Course.ps1 -Checkpoint 03-modernized` from the repository
root to copy this state into `work/`.

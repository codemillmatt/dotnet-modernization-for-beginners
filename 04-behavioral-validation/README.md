# Chapter 04: Behavioral and data validation

## Outcomes

You will:

- prove the modernized application against the baseline contract;
- distinguish fast in-memory tests from provider-realistic SQL tests;
- validate schema, seed data, queries, errors, and security behavior;
- define evidence still required for an existing production database.

## State contract

- **Start:** Chapter 03 modernized source and reviewed change log.
- **End:** Independent validation evidence and explicit deferred-risk list.
- **Known-good end:** `checkpoints/04-validated`.
- **Verify:** Release build and full suite pass; Windows exercises SQL LocalDB.
- **Reset/resume:** `.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized` to
  start, or `-Checkpoint 04-validated` for model evidence.
- **If output differs:** A different implementation is acceptable only when it
  satisfies the same or stronger observable contract.

## 1. Explain: compilation is one layer

Validation has distinct layers:

1. compile and dependency resolution;
2. model and unit validation;
3. HTTP routing, responses, forms, and security;
4. database initialization, migrations, persistence, and queries;
5. production-like performance, concurrency, identity, and failures;
6. deployment, observability, rollback, and restore.

The checkpoint uses fast in-memory tests on every platform and adds SQL Server
LocalDB migration/query coverage on Windows. In-memory success does not prove
SQL translation, collation, constraints, or transactions.

## 2. Predict: map changes to behavior

For each Chapter 03 diff, predict at least one failure a build cannot detect:

| Change | Predicted behavior risk | Independent evidence |
|---|---|---|
| Endpoint routing |  |  |
| Controller binding |  |  |
| Razor forms |  |  |
| Configuration providers |  |  |
| EF Core query and migration |  |  |

## 3. Perform: run the full suite

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
Set-Location .\work
dotnet tool restore
dotnet restore .\BookCatalog.slnx
dotnet build .\BookCatalog.slnx --configuration Release --no-restore
dotnet test .\BookCatalog.slnx --configuration Release --no-build
```

Inspect the test source. Confirm it exercises:

- create, edit, delete, and persistence;
- data-annotation and invalid-model behavior;
- default route, 200, 400, and 404 behavior;
- seven seeded records and six active records;
- configuration loading;
- anti-forgery metadata and tokenless rejection;
- active-only, title-ordered EF query;
- SQL Server migration/query behavior on Windows;
- health endpoint.

## 4. Inspect: schema and data evidence

Review the generated migration under
`src/BookCatalog.Web/Data/Migrations/`. Generate SQL without applying it:

```powershell
dotnet ef migrations script `
  --project .\src\BookCatalog.Web\BookCatalog.Web.csproj `
  --startup-project .\src\BookCatalog.Web\BookCatalog.Web.csproj `
  --idempotent `
  --output .\migration-review.sql
```

Inspect destructive statements, types, lengths, nullability, identity values,
constraints, seed operations, and transaction boundaries. Do not commit the
temporary review output unless it is an approved deployment artifact.

For an existing database, add:

- verified backup and restore rehearsal;
- source/target row counts and business totals;
- identity, key, collation, date/time, null, and encoding checks;
- downtime or expand/contract sequencing;
- retry and connection-resiliency tests;
- rollback or roll-forward criteria and owner.

## 5. Validate independently

Create your evidence from command output, not the model answer. Compare coverage
with `../checkpoints/04-validated/validation-evidence.md`. Record environment,
provider, command, result, and deferred risk without recording identities or
secrets.

## 6. Troubleshoot a variation

Change a copy of the active-book query ordering, run the focused test, observe
the failure, restore the code, and rerun the full suite. Explain why the
in-memory and SQL results could differ under another collation.

If a test passes only on one provider, stop and classify whether the difference
is expected, a test limitation, or a production behavior risk.

## 7. Transfer

Add a characterization test for one external service, authentication rule, or
configuration transform in another application. State which test double and
production-like validation are both required.

## 8. Knowledge check and reflection

1. Why does an HTTP 200 not prove persistence?
2. What can an in-memory EF provider hide?
3. Who applies production schema changes, and why?
4. Which remaining evidence blocks your production release?

**Learner artifact:** Reviewed validation evidence and deferred-risk list.

Continue to [Chapter 05: Cloud readiness](../05-cloud-readiness/README.md).

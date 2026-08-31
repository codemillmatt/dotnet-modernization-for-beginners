# BookCatalog behavior contract

Use this contract to compare the legacy application with the generated modernized application. A successful build is necessary, but it does not prove that the application still behaves correctly.

## Automated characterization

1. Build and run BookCatalog.
2. In a separate PowerShell terminal, run:

   ```pwsh
   .\scripts\Test-BookCatalogBehavior.ps1 -BaseUrl https://localhost:44300
   ```

   If IIS Express chooses another URL, pass that URL instead. For a development certificate that is not trusted, add `-SkipCertificateCheck` when using PowerShell 7.

3. Save the output before the upgrade and after each Chapter 03 review gate.

The script verifies:

| Behavior | Expected result |
|---|---|
| Seed data | Six active seed books are visible; the inactive Matrix record is hidden |
| Index query | Active books are ordered by title |
| Missing record | An unknown details ID returns HTTP 404 |
| Validation | Title and author are required; published year must be between 1800 and 2100 |
| Create | A submitted title, author, ISBN, year, and active state are persisted |
| Edit | Editable fields change without overwriting `CreatedDate` |
| Delete | The selected record is removed |
| Request API | The supplied User-Agent is displayed |
| Anti-forgery | Create, edit, and delete forms emit tokens; a modifying request without a token is rejected |

The script creates a uniquely named record and deletes it before completion. If it stops early, delete the `Characterization ...` record manually before rerunning.

## Review evidence

Record this table in your Chapter 03 notes:

| Checkpoint | Commit | Script result | Intentional differences |
|---|---|---|---|
| Legacy baseline |  |  | None |
| SDK-style conversion |  |  | None expected |
| ASP.NET Core conversion |  |  |  |
| EF Core conversion |  |  |  |
| Final modernized app |  |  |  |

Any intentional difference needs a reason, an approver, and an updated expected result. In particular, do not silently lose anti-forgery validation, the active-only query, the edit allow-list, or the User-Agent display during framework API replacement.

## Manual database checks

The HTTP harness proves observable behavior. Also inspect the generated startup and data-access code:

- Seed logic must be idempotent; restarting the app must not duplicate records.
- `DbContext` should be scoped through dependency injection rather than constructed by the controller.
- The index query should remain filtered and ordered before materialization.
- The edit action should update only the intended fields, preserving `CreatedDate`.
- The selected schema strategy must match the Chapter 03 decision record.

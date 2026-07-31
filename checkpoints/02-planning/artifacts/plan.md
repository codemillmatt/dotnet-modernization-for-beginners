# Customized upgrade plan

This is a **model artifact** showing the shape and level of detail to aim for. Your
`plan.md` will name different tasks. See
[when your output differs](../../../docs/OUTPUT-DIFFERS.md).
{: .note }

## Task sequence

Every task below acts on the single `BookCatalog.Web` project. There is no project
ordering to argue about — which is exactly why the ordering *inside* the project has to
be deliberate.

| Task | Depends on | Done when | Rollback gate |
|---|---|---|---|
| 01 Baseline | None | Clean branch; legacy solution builds and `/Books` loads with seed data | Any unexplained baseline failure |
| 02 Package format | 01 | `packages.config` replaced by `PackageReference`; transitive versions compared before and after | Restore graph differs without explanation |
| 03 Project structure | 02 | Project is SDK-style and targets net10.0; build is clean | New build warnings that weren't there before |
| 04 Configuration | 03 | `Web.config` settings resolved from `appsettings.json` through the options pattern; no secrets in source | A connection string or secret lands in a committed file |
| 05 Startup and hosting | 04 | `Global.asax` replaced by `Program.cs` with DI and middleware; app starts | App fails to start, or a route stops resolving |
| 06 ASP.NET Core MVC | 05 | Controllers and views ported; routing, model binding, validation messages, and anti-forgery all verified by hand | Any route, status code, validation message, or security drift |
| 07 EF Core port | 06 | Checked-in migration; seed, CRUD, and index ordering verified against LocalDB; no `EnsureCreated()` on a production path | Migration SQL unreviewed, or data doesn't reconcile |
| 08 Final validation | 07 | Release build with no new warnings; every row of the Chapter 03 behavior table confirmed | Any deferred critical risk lacks an owner |

## Why this order

Tasks 02 and 03 rewrite the project file. Every later task edits code *inside* that
project. Doing the format work first means the code changes land once. Reverse them and
you re-apply the same edits after the file format changes underneath you.

Task 04 comes before 05 because startup code reads configuration. Wiring DI against
configuration that hasn't moved yet means writing it twice.

## Acceptance evidence

Each task commit includes the reviewed diff, the commands run, the result, known behavior
risk, deferred work, and an approver.

This solution has no automated tests, so "the result" is a human observation, not a test
run. Write down what you actually clicked. A validation line that says "tests pass" on a
codebase with no tests is worse than a blank one, because it reads like coverage.
{: .warning }

Task 07 additionally requires generated SQL review and a restore rehearsal against a
sanitized copy of existing data.

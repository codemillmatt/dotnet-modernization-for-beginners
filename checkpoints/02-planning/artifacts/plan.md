# Customized upgrade plan

## Task sequence

| Task | Depends on | Done when | Rollback gate |
|---|---|---|---|
| 01 Baseline | None | Clean branch; legacy build and nine behavior tests pass | Any unexplained baseline failure |
| 02 Core dependency | 01 | Model project has a modern target and validation behavior is unchanged | Legacy web no longer builds |
| 03 Project structure | 02 | Web project is SDK-style with explicit package dispositions | Dependency graph or restore differs without explanation |
| 04 ASP.NET Core | 03 | Startup, routing, controllers, configuration, Razor, errors, and anti-forgery pass focused tests | Any route, status, validation, or security drift |
| 05 EF Core port | 04 | Checked-in migration; seed, CRUD, and query tests pass; no `EnsureCreated()` production path | Migration/data evidence incomplete |
| 06 Final validation | 05 | Release build has no warnings and all behavior tests pass | Any deferred critical risk lacks owner/approval |

## Acceptance evidence

Each task commit includes the reviewed diff, commands run, test result, known
behavior risk, deferred work, and approver. Task 05 additionally requires
generated SQL review and a restore rehearsal for existing data.

# Chapter 03: Upgrade execution with review and rollback gates

## Outcomes

You will:

- approve or reject commands and diffs deliberately;
- steer an unsafe or over-broad change;
- run focused and full behavior validation at every gate;
- explain representative migration diffs through five review lenses;
- produce a reviewed change log and recover from a failed task.

## State contract

- **Start:** Approved Chapter 02 plan, clean branch, passing legacy suite.
- **End:** Buildable .NET 10 application with nine passing behavior tests and a
  checked-in EF Core migration.
- **Known-good end:** `checkpoints/03-modernized`.
- **Verify:** Release build has no warnings/errors; all behavior tests pass.
- **Reset/resume:** Start with `-Checkpoint 02-planning`; inspect the known-good
  result with `-Checkpoint 03-modernized`.
- **If output differs:** Behavior evidence and acceptance gates decide success,
  not file or line-count similarity.

## 1. Explain: the execution control loop

For each task:

1. predict files, behavior, and commands;
2. read the task scope;
3. approve only explained, bounded commands;
4. inspect the complete diff;
5. run focused tests, then the full suite;
6. update the change log;
7. commit the coherent task;
8. continue, revise, retry, pause, or roll back.

Use `../templates/change-log.md`. Never begin execution from an uncommitted
working tree.

## 2. Predict: establish expected diffs

Before each task, list files expected to change. A package or startup task that
unexpectedly rewrites controllers is grounds to pause and revise the scope.

Read every command for destructive flags, working directory, network effects,
secret handling, and cloud scope. Deny commands you do not understand.

## 3. Perform and inspect: representative reviews

Apply the five lenses to each major migration:

| Area | What changed | Why | Agent may miss | Behavior at risk | Proof |
|---|---|---|---|---|---|
| Project conversion | SDK project, explicit references, stable target | Modern build model | lost content, dependency, analyzer, publish settings | build/publish shape | restore/build and artifact inspection |
| Startup | `Global.asax` to `Program.cs` and DI | ASP.NET Core hosting | middleware order, environment errors, startup side effects | every request and failure | route, health, error tests |
| Routing | route table to endpoint routing | New pipeline | order, defaults, constraints, trailing paths | URLs/status codes | HTTP route matrix |
| Controllers | DI, async results, explicit bind allowlist | Modern MVC and EF | overposting, cancellation, null/status differences | CRUD/security/errors | CRUD, validation, 400/404 tests |
| Configuration | `web.config` to providers | Environment-aware configuration | precedence, transforms, secret/log exposure | wrong database/settings | configuration tests per environment |
| Razor | tag helpers and imports | ASP.NET Core rendering | anti-forgery, encoding, validation, links | forms/XSS/navigation | rendered form and token tests |
| EF Core | options DI, query port, migration | EF Core is a rewrite | tracking, nulls, loading, transactions, collation | data/schema/query | provider tests, migration SQL, reconciliation |

Open `checkpoints/03-modernized` for an annotated known-good implementation,
not as a file-copy shortcut.

## 4. Validate after every gate

Before retargeting, use the Windows legacy commands:

```powershell
nuget restore .\BookCatalog.sln
msbuild .\BookCatalog.sln /p:Configuration=Release
dotnet test .\tests\BookCatalog.CharacterizationTests\BookCatalog.CharacterizationTests.csproj --configuration Release
```

After the solution reaches modern .NET, keep the same named behavior contract:

```powershell
dotnet restore .\BookCatalog.slnx
dotnet build .\BookCatalog.slnx --configuration Release --no-restore
dotnet test .\BookCatalog.slnx --configuration Release --no-build
```

Run focused tests for the current task first, then the full contract. Windows
also runs the SQL Server LocalDB provider test. Record commands and results in
the change log. A green build with a red behavior test is a failed gate.

## 5. Practice intervention and recovery

Perform each action at least once:

- **Reject** a source edit outside the current task.
- **Revise** an over-broad task into smaller scopes.
- **Retry** only after explaining and correcting a failed command.
- **Pause** before EF or another high-data-risk boundary.
- **Roll back** a deliberately harmless change with `git restore` before commit,
  or revert the task commit after commit.

Do not use reset commands that discard unrelated uncommitted work.

## 6. EF and schema gate

Do not replace the EF6 initializer with production `EnsureCreated()`. Generate
and inspect an EF Core migration, review its SQL, and retain a separate data
deployment identity. The app must not apply migrations in Production and the
runtime must not need DDL roles.

For existing data, add backup/restore rehearsal, downtime or expand/contract
strategy, row/business reconciliation, and rollback/roll-forward criteria.

## 7. Transfer

Choose one representative diff from your branch. Explain all five lenses to a
reviewer who did not run the agent. Ask the reviewer to identify one missing
test, then add it or register an explicit deferred risk.

## 8. Knowledge check and reflection

1. Why should focused tests run before the full suite?
2. What evidence permits a task commit?
3. Why is a checked-in migration safer than runtime schema creation?
4. Describe one rejected change and the improved retry.

**Learner artifact:** Reviewed change log with diff rationale, validation
evidence, intervention practice, commits, and deferred risks.

Continue to
[Chapter 04: Behavioral validation](../04-behavioral-validation/README.md).

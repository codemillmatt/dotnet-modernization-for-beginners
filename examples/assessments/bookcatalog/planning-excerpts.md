# BookCatalog planning excerpts

These are selections from the supplied September 21, 2026 planning artifacts.
They show the recorded choices, not the revised course's recommended choices.
Each fenced block is verbatim. The surrounding explanation isn't tool output.

## The first plan authorized planning only

Source: original `plan.md`, **Overview**.

```text
**Scope**: One assessed web project, 636 lines of code, and its planned ASP.NET Core counterpart in BookCatalog.sln. The data helper, completed reference, tests, and course website remain excluded. This document authorizes no execution; stop for Guided review. No Git commits.
```

Source: original `plan.md`, **Upgrade Options**.

```text
| Option | Selected | Why |
|--------|----------|-----|
| Upgrade Strategy | All-at-Once | One assessed project with no dependency ordering. |
| Project Approach | Side-by-side | Preserve the legacy host while migrating the incompatible web surface. |
| Unsupported API Handling | Fix Inline | Resolve incompatibilities in their migration tasks without deferred stubs. |
| System.Web Adapters | Use System.Web Adapters | Support incremental migration, with cleanup before completion. |
| Assembly Binding Redirects | Document and Review Before Removing | Review the three reported issues against actual assembly metadata. |
| Nullable Reference Types | Leave Disabled | Avoid adding nullable migration to the framework migration. |
| Entity Framework | Keep EF6 | Avoid simultaneous EF Core behavioral changes. |
```

All-at-Once describes upgrade ordering here. It didn't prevent the agent from selecting two web hosts.
The proposed sibling was `src\BookCatalog.Web.Core\BookCatalog.Web.Core.csproj`.
The plan retained the original Framework project.

## Shared data changed the work

Source: original `plan.md`, task **02-scaffold-bookcatalog-web**.

```text
The legacy Web.config points to a LocalDB MDF via `|DataDirectory|`. Establish an explicit shared database location so the new content root does not silently attach a different file. Preserve existing data and EF6 behavior, avoid destructive initializers or competing schema writers, and do not copy production secrets into artifacts. Any child task touching connection strings or data configuration must retain #skill:managing-shared-database-schema.
```

That choice introduced shared-schema ownership, restricted runtime identities, and restore checks.
The task records later describe disabled startup creation and seeding, temporary HTTP route guards, and deferred database checks.
These requirements belong to the recorded two-host approach. They aren't prerequisites for the revised disposable-data demo.

## Later approval changed the validation scope

Source: `final-mod-agent-files\plan.md`, task **04-validate-bookcatalog-migration**.

```text
Resume deferred 02.01 Docker database admission before database-backed checks. Latest user decision permits a freshly provisioned disposable fixture instead of an original-data copy; verify its backup/restore, physical schema/model match and restricted runtime identity separate from the offline fixture provisioner. Production schema ownership remains external. Never access protected original LocalDB or claim original-data parity from this fixture. Complete parent 02 only after admission passes. Remove temporary proxy/adapter dependencies only after observed fixture parity, then repeat build and HTTP checks.
```

The later preferences also change Guided execution to Automatic execution.
That approval didn't remove the recorded technical checks or mark the upgrade complete.
The copied snapshot still has final validation in progress.

For the revised course, choose an in-place ASP.NET Core MVC upgrade to .NET 10 and EF Core.
Let EF Core create and seed a separate demo database.
Preserve application behavior, but don't require preservation of the original records or a shared schema.
This is the approved teaching decision, not a claim that this supplied run followed it.

**[Recording and provenance](README.md)** · **[Execution excerpts](execution-excerpts.md)**

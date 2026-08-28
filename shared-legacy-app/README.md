# BookCatalog modernization baseline

This folder is the initial course application: a small ASP.NET MVC 5 application on .NET Framework 4.8 with Entity Framework 6 and LocalDB. Its intentionally limited domain keeps the course focused on migration decisions rather than application complexity.

The chapters modify this same working tree in sequence:

1. **Chapter 01 — Assessment:** inspect BookCatalog and annotate the generated findings.
2. **Chapter 02 — Planning:** select a strategy and review the generated upgrade plan.
3. **Chapter 03 — Upgrade execution:** apply and review the .NET Framework-to-.NET 10 upgrade.
4. **Chapter 04 — Azure deployment:** prepare the modernized application for Azure and deploy it.

## Before you begin

Create a working branch before invoking **Modernize**:

```pwsh
git switch -c bookcatalog-modernization
```

GitHub Copilot upgrade stores assessment, options, plans, task state, and progress under `.github/upgrades/`. Commit that state at the review gates recommended in the chapters so the agent can resume and you can compare or roll back decisions.

The baseline includes a [behavior contract](BEHAVIOR-CONTRACT.md) and an HTTP verification script. Capture the legacy result before the upgrade and rerun the same checks after it.

## Reset or recover

- **Resume:** reopen `BookCatalog.sln`, choose **Modernize**, and ask the agent to resume from the committed state under `.github/upgrades/`.
- **Undo one reviewed task:** revert the commit created at that task's review gate.
- **Restart the course:** create a new branch from the repository's default branch. Do not delete generated state from a branch you may need for comparison.

These recovery paths assume that each review gate was committed. The course does not provide midway code snapshots because generating and reviewing the upgrade is part of the exercise.

# Immutable course checkpoints

Checkpoints are reference states, not folders to edit. Use
`scripts/Reset-Course.ps1` to copy a selected state into ignored `work/`.

| Checkpoint | Contents | Verification |
|---|---|---|
| 00 | Small-app assessment model | Compare evidence to `00-introduction/code` |
| 01 | BookCatalog assessment, worksheet, risk model | Trace each representative finding to source |
| 02 | Options, plan, tasks, customized comparison | Check dependencies, acceptance, rollback, ownership |
| 03 | Full .NET 10 application, tests, EF migration | `dotnet build` and `dotnet test` |
| 04 | Independent validation evidence model | Reproduce every cited command |
| 05 | Bicep, migration identity, runtime grants, deploy/test/cleanup scripts | Bicep build and PowerShell parse |
| 06 | Synthetic deployment evidence and architecture record | Replace placeholders with learner evidence |
| 07 | Capstone rubric and model transfer-plan structure | Score against cited evidence |

Agent-generated output can differ. These artifacts demonstrate quality and
coverage, not text that learners must reproduce.

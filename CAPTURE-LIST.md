# Screenshot capture list

Every screenshot in the course is currently `assets/img/placeholder.png`. This file lists
what needs capturing to replace it.

This file is excluded from the published site. It's a working list, not learner content.

## How to capture

- Windows 11, Visual Studio 2026, light theme, default font size
- Capture at 100% display scaling, then crop tightly to the region described
- No file paths, no user names, no repository names other than `BookCatalog`
- No email addresses, tenant names, or subscription IDs
- Save as PNG to `assets/img/` using the filename in the table
- Replace the `../assets/img/placeholder.png` reference in the listed file

Do not commit an unredacted screenshot. Crop rather than blur where possible — a crop
can't be undone.

## The list

| # | File to update | Suggested filename | What to capture | Crop to |
|---|---|---|---|---|
| 1 | `00-setup/README.md` | `vs-modernize-menu.png` | Solution Explorer right-click menu with **Modernize** highlighted | The menu only |
| 2 | `00-setup/README.md` | `assessment-pause.png` | Copilot Chat pausing at the end of assessment in Guided mode | The chat message |
| 3 | `01-assessment/README.md` | `assessment-md.png` | `assessment.md` open in the editor, showing section headings | The editor pane |
| 4 | `02-planning/README.md` | `plan-md.png` | `plan.md` open beside Copilot Chat | Both panes |
| 5 | `03-execution/README.md` | `execution-task.png` | The agent working a task, with build output visible | Chat plus output |
| 6 | `04-teaching-the-agent/README.md` | `scenario-instructions.png` | `scenario-instructions.md` open, showing the four section headings | The editor pane |
| 7 | `05-azure-migration/README.md` | `azure-assessment-report.png` | The Azure migration assessment report with **Run Task** buttons | The report pane |
| 8 | `06-deploy-and-validate/README.md` | `main-bicep.png` | `main.bicep` open at the managed identity block | The editor pane |

## Also worth capturing later

- The pre-initialization prompts (target framework, branch strategy, flow mode)
- `tasks.md` mid-run, showing completed and pending tasks
- A failed task in `progress-details.md`
- The output of "Check my git changes and add diffs as examples to my instruction file"
- The Visual Studio Installer components list, for the setup troubleshooting entry

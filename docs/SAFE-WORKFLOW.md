---
title: Working safely with the agent
parent: Reference
nav_order: 7
permalink: /reference/safe-workflow/
---

# Working safely with the agent

The agent reads files, edits code, runs commands, and proposes cloud resources. Treat it
like a capable new contributor: give it a safe place to work, then review its output.

Set this up once. Then get on with the course.

## Set it up once

1. Check your organization's Copilot policy and data-handling rules. Don't send
   credentials, production data, customer data, or regulated information.
2. Work on a branch from a reviewed baseline.
3. Start with a clean working tree — `git status --short` should be empty.
4. Build, and run your tests. Commit that baseline.
5. Let the agent commit after each task. This is the setting that makes everything else
   recoverable.

That's it. You now have an undo button for every task the agent will run.

## Review at stage boundaries

You don't need to review every keystroke. You do need to read four things:

- **The generated Markdown** before approving the next stage — `assessment.md`, `plan.md`
- **The diff** — `git diff --stat` for shape, `git diff` for anything that surprises you
- **Any terminal command you don't recognize** — what does it change, and is it reversible?
- **Your own test results** — the agent's summary of a test run is a summary, not the run

Commit `.github/upgrades/` along with your branch. It's state, review evidence, and a
recovery point all at once.
{: .tip }

## Recovery, weakest move to strongest

| Situation | Response |
|---|---|
| Wrong assumption | Say what's actually true and ask for a revised artifact |
| Task too broad | Split it in `plan.md` and give each piece its own validation |
| Transient failure | Fix the condition, retry only the failed step |
| Need more control | Say `pause` to switch to Guided |
| A command you don't like | Deny it, and ask what it was trying to accomplish |
| Task made a mess | `git revert <commit-sha>`, then re-scope and re-run |
| Agent state is corrupt | Delete only the scenario folder and restart from a checkpoint |

Never run a broad `git reset --hard` on a tree with uncommitted work in it. The course's
reset script only ever rewrites the ignored `work/` folder.
{: .warning }

## What to look for in generated code

Behavior drift, authorization changes, overposting, data loss, insecure defaults, new
dependency vulnerabilities, secrets in configuration, sensitive values in logs, and
unbounded cloud cost.

Generated infrastructure deserves the same scrutiny as generated code, plus
`az bicep build`, `what-if`, and a look at whether the role assignments are actually
least-privilege.

## Related

- [Proving behavior didn't change](VALIDATION.md)
- [Lab versus production](PRODUCTION-READINESS.md)
- [Troubleshooting](TROUBLESHOOTING.md)

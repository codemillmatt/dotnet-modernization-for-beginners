---
title: "04 · Teaching the agent"
nav_order: 6
permalink: /teaching-the-agent/
---

# 04 · Teaching the agent

By the end of this chapter you'll have written into the agent's persistent memory, and
taught it a code pattern by fixing one instance by hand.

**Time: ~30 minutes** · **You need:** an upgrade in progress or complete from Chapter 03

## What you'll do

- Write preferences into `scenario-instructions.md` and watch them stick
- Fix one thing by hand and have the agent turn your diff into a reusable example
- Learn where custom skills live and which location wins

This is the chapter that answers "how do I change what it does?" — and it's the part of
the product most people never find.

## Before you start

Have a running upgrade, or reset to a finished one:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

## Steps

### 1. Open the agent's memory

```text
.github/upgrades/{scenarioId}/scenario-instructions.md
```

Microsoft describes this file as the agent's persistent memory: it's loaded into context
on every interaction, so anything you write there influences every decision the agent
makes for the rest of the scenario.

That's a meaningfully different thing from chat. Chat is a conversation the agent
eventually forgets. This file is a standing order.

The file has four sections:

| Section | What goes here |
|---|---|
| User Preferences (Technical) | Libraries, patterns, and framework choices you want followed |
| User Preferences (Execution Style) | How you want it to work — commit granularity, when to pause |
| Key Decisions Log | Decisions you made and why, so they don't get relitigated |
| Custom Instructions per Task | Guidance scoped to one specific task |

### 2. Write a technical preference

Add something specific and testable:

```markdown
## User Preferences (Technical)

- Use `Microsoft.Extensions.Logging` for all logging. Do not introduce Serilog.
- Prefer constructor injection. Do not use service locator patterns.
- Keep `IBookRepository` as the data access seam. Controllers must not touch `DbContext`
  directly.
```

Save it, then ask:

```text
Reread scenario-instructions.md and tell me what you'll do differently.
```

The agent should echo your preferences back. If it doesn't, check the file path and that
you saved.

![Placeholder for a screenshot of scenario-instructions.md open in Visual Studio](../assets/img/placeholder.png)

### 3. Write an execution-style preference

Technical preferences shape the code. Execution-style preferences shape the process:

```markdown
## User Preferences (Execution Style)

- Commit after each task with a message naming the task.
- Pause and ask before deleting any file.
- Do not modify anything under tests/ without telling me first.
```

That last one is worth borrowing verbatim. An agent that quietly edits your tests to make
them pass has removed the only evidence you had.
{: .warning }

### 4. Teach it from your own fix

This is the best thing in the product.

Instead of describing a pattern in prose, **do it once by hand and let the agent read your
diff.**

1. Pick a repetitive change the agent got subtly wrong — say, how it converts
   `HttpContext.Current.Session` access.
2. Fix exactly one instance yourself, the way you want it done.
3. Leave the change uncommitted.
4. Then say:

```text
Check my git changes and add diffs as examples to my instruction file
```

The agent reads your working-tree diff and appends it to the instruction file as a worked
example. From then on it has your actual before-and-after code to pattern-match against,
not your description of it.

Show, don't tell. One real diff beats three paragraphs of "prefer the options pattern,"
because the diff is unambiguous about naming, placement, and style.
{: .tip }

Open `scenario-instructions.md` and read what it wrote. Then run a task that hits the same
pattern and check whether the output matches your example.

### 5. Record a decision

The Key Decisions Log exists so you stop re-answering the same question:

```markdown
## Key Decisions Log

- **2026-07-31 — Stay on EF6 for this upgrade.** EF Core migration is a separate project
  with its own testing plan. Do not propose EF Core changes during this upgrade.
- **2026-07-31 — Target .NET 10.** Not .NET 8. We want the longest support runway.
```

Dating and justifying each entry means the next person — including you in three weeks —
can tell a decision from an accident.

### 6. Know where custom skills live

Skills are reusable instructions for specific transformations. When more than one is
available, the most specific location wins:

| Priority | Location | Scope |
|---|---|---|
| Highest | `.copilot/skills/` in your user profile folder | You, across every repository |
| ↓ | `.github/upgrades/skills/` | This scenario |
| ↓ | `.github/skills/` | This repository |
| Lowest | Built into the product | Everyone |

Put team conventions in `.github/skills/` and commit them. Keep personal habits in your
user-profile folder so you don't impose them on teammates.

## What just happened

You moved from *steering one run* to *changing how the agent works*.

Editing `plan.md` fixes this upgrade. Editing `scenario-instructions.md` fixes every task
in this scenario. Adding a skill fixes every scenario in the repository. That escalation —
task, scenario, repository — is the mental model to keep.

And "learn from my fix" flips the usual direction of an AI tool. Instead of you learning to
prompt it well, it learns your codebase's conventions from the code you already write.

## Try changing it

Write a preference you know contradicts the agent's default, then run a task and see
whether it holds:

```markdown
- Use file-scoped namespaces everywhere. Never use block-scoped namespaces.
```

If a later task produces block-scoped namespaces anyway, that's real information about how
strongly the file steers behavior. Note it. Instruction files are guidance, not a compiler.

## If something goes wrong

| Problem | What to do |
|---|---|
| The agent ignores your instructions | Be more specific. "Use dependency injection" is vague; "register `IBookRepository` in `Program.cs` and inject it into controllers" is actionable |
| Your edits get overwritten | Confirm you're editing `scenario-instructions.md`, not `tasks.md` |
| "Check my git changes" finds nothing | The changes must be in the working tree or staged, and not yet committed |
| A skill isn't being applied | Check the priority table. A higher-priority location may be overriding it |

## Check yourself

1. What's the difference between telling the agent something in chat and writing it in
   `scenario-instructions.md`?
2. Why is a diff a better instruction than a description?
3. Where would you put a convention every developer on your team should follow?

---

Next → [Chapter 05: Migrating to Azure](../05-azure-migration/README.md)

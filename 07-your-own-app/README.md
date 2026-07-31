---
title: "07 · Bring your own app"
nav_order: 9
permalink: /your-own-app/
---

# 07 · Bring your own app

By the end of this chapter you'll have an assessment of an application you actually care
about, and a decision about what to do with it.

**Time: ~30 minutes** for the core exercise · Optional stretch track below

## Do this in 30 minutes

You've run the whole loop on a sample. The sample was designed to behave. Yours won't, and
that's the point — the first hour on a real codebase teaches you more than the previous
five did.

### 1. Pick an app (2 min)

Good candidates:

- .NET Framework 4.x, and someone still uses it
- Small enough that you can name its projects from memory
- You have a Git repository and can create a branch
- It builds today

If nothing fits, use a project from your organization's archive, or an open-source .NET
Framework app you've been curious about.

Don't start with your largest, most business-critical system. Start with the one where
being wrong is cheap.
{: .tip }

### 2. Establish a baseline (5 min)

Build it. Run whatever tests exist. Write down the result — including "there are no tests,"
which is itself a finding and the first thing your plan should address.

```powershell
git checkout -b modernization-assessment
git status
```

If it doesn't build today, stop here. Fix that first. An agent working from a broken
baseline can't tell your problems from its own.

### 3. Run assessment only (15 min)

Right-click the solution → **Modernize**:

```text
Upgrade my solution to .NET 10
```

Choose **Guided** mode. When assessment finishes, **stop**. Don't plan, don't execute.

### 4. Answer three questions (8 min)

Open `assessment.md` and write down:

1. **What's the single hardest thing in here?** Not the longest list — the item that would
   consume the most time or carries the most risk.
2. **What does the agent not know?** Dead code, pinned packages, a rewrite already
   scheduled, a project nobody understands.
3. **Would you do this upgrade?** A defensible "no, not this quarter, because…" is a
   complete and correct answer.

That's the exercise. You've now used the tool for its highest-value purpose: **deciding
whether to do the work**, cheaply, before committing to it.

## What just happened

The tooling's most underrated capability is that assessment is nearly free and completely
reversible. It reads your code and writes some Markdown. Nothing else changes.

That means "should we modernize this?" stops being a debate and becomes a twenty-minute
task with an artifact at the end. You can run it on five applications in an afternoon and
rank them.

## Stretch track

If you want to take it further, the exercises below get progressively more involved. Do
them in any order; there's no completion state to reach.

### Plan it

Continue to planning, review `plan.md`, and reorder it the way you did in
[Chapter 02](../02-planning/README.md). Diff the default against yours. On a real codebase the diff
is usually much larger — and much more interesting.

### Teach the agent your conventions

Write your team's actual standards into `scenario-instructions.md`. Then fix one instance
of something by hand and run:

```text
Check my git changes and add diffs as examples to my instruction file
```

On a real codebase with real conventions, this is where the tool stops feeling generic.

### Execute one task

Pick the smallest, most mechanical task in the plan — usually the `packages.config` to
`PackageReference` migration — and run only that one. Review the diff line by line.

One well-reviewed task tells you more about whether to trust the agent on this codebase
than ten unreviewed ones.

### Assess for Azure

Run **Migrate to Azure** on an app that's already on modern .NET. Real applications
usually light up several predefined tasks that BookCatalog can't — file storage, queues,
email, caching.

### Score yourself against the rubric

There's a detailed rubric covering assessment quality, plan quality, validation evidence,
and architecture decisions:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 07-capstone
```

It's a useful self-check if you're going to present this work to someone. It is not a
requirement, and it's not the point of the chapter.

## Working with a big codebase

Real solutions are bigger than BookCatalog. Some things that help:

| Situation | What to do |
|---|---|
| 50+ projects | Assess the whole solution, but plan and execute one subsystem at a time |
| Private NuGet feeds | Authenticate before starting. Restore failures look like compatibility failures |
| Custom MSBuild targets | Expect the agent to need help. Put the explanation in `scenario-instructions.md` |
| No tests | Add characterization tests to the parts you're changing before you change them. See [proving behavior didn't change](../docs/VALIDATION.md) |
| Shared code across solutions | Upgrade the shared library first, bottom-up, and publish it before moving consumers |

## Where to go next

- [Prompt and file cheat sheet](../docs/CHEAT-SHEET.md) — one page, keep it open
- [Lab versus production](../docs/PRODUCTION-READINESS.md) — what this course simplified
- [Other surfaces: VS Code and CLI](../docs/CROSS-SURFACE.md) — same workflow elsewhere
- [GitHub Copilot modernization documentation](https://learn.microsoft.com/dotnet/core/porting/github-copilot-app-modernization/overview)
- Found a bug in the agent? [dotnet/modernize-dotnet](https://github.com/dotnet/modernize-dotnet)
- Found a problem in this course? [Open an issue](https://github.com/codemillmatt/dotnet-modernization-for-beginners/issues)

## Check yourself

1. What's the hardest thing in your own app's assessment, and why that one?
2. What would you have to tell the agent that it can't discover from your source?
3. On the evidence you now have, would you do the upgrade? Say why either way.

---

← Back to [the course home page](../README.md)

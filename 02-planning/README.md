# Chapter 02: Make the strategy decision

The upgrade agent can propose options, but it does not own BookCatalog's risk tolerance. Decide first, reveal the recorded recommendation second, then edit the generated plan.

## Learning outcomes

By the end of this chapter, you will:

- choose and defend an upgrade strategy;
- reject plausible alternatives with reasons;
- define rollback and behavioral gates;
- review and reorder generated tasks; and
- approve a plan only after it reflects your decisions.

**Learner artifacts:** a strategy decision record and a reviewed upgrade plan.

## 1. Write the decision before asking the agent

Answer these questions in your notes:

1. Why is all-at-once reasonable, or unreasonable, for a one-project application?
2. Under what conditions would a side-by-side migration be safer?
3. Should BookCatalog keep EF6 temporarily or migrate to EF Core in the same effort?
4. Should SDK-style conversion be isolated from framework retargeting?
5. Which items in the [behavior contract](../shared-legacy-app/BEHAVIOR-CONTRACT.md) are release gates?
6. Where must rollback commits exist?
7. Which generated tasks would you reorder, split, or amend?

Use this decision record:

| Field | Your decision |
|---|---|
| Selected strategy | |
| Rejected alternatives | |
| Assumptions | |
| Risks | |
| Rollback points | |
| Verification method | |
| EF/schema strategy | |

Do not open the course recommendation until you have completed the record.

<details>
<summary>Course recommendation after you decide</summary>

For this one-project, roughly 633-line sample, use an in-place, all-at-once application migration while keeping **separate commits and review gates** for project-format conversion, ASP.NET Core migration, and EF migration. Move to EF Core because the data layer is one context with disposable seed data and the course explicitly teaches that review. Preserve the full behavior contract.

Use side-by-side instead when a large web surface must remain available, routes must move incrementally, consumers cannot tolerate a coordinated cutover, or rollback requires traffic switching. Keep EF6 temporarily when queries, provider behavior, migrations, stored procedures, or production data risks require an independent workstream.

</details>

## 2. Move from assessment to plan without switching modes

At the assessment pause, use an explicit prompt:

> Generate upgrade options and a plan from the annotated assessment. Keep project-format conversion separate from framework retargeting. Include the BookCatalog behavior contract and an explicit database schema decision. Remain in Guided mode and pause when the plan is ready for review; do not execute it.

Do **not** use a bare **"Continue"** or **"Go ahead."** Current product guidance treats those phrases as selecting Automatic mode. If necessary, first enter **"Switch to guided mode."**

The agent may create artifacts such as `upgrade-options.md`, `plan.md`, `tasks.md`, or similar files under `.github/upgrades/`. Filenames and task boundaries can vary by product version. Commit the generated state after review.

## 3. Challenge the generated options

Review the options against BookCatalog evidence:

| Decision | Evidence for BookCatalog | Question to ask |
|---|---|---|
| All-at-once versus side-by-side | One project, one controller, no public API in the sample | Is one coordinated cutover acceptable? |
| In-place versus parallel project | Small surface, but ASP.NET hosting changes substantially | Is a clean rollback commit enough? |
| EF6 versus EF Core | One context and seed initializer | Is combining ORM behavior risk with hosting risk acceptable? |
| SDK conversion sequencing | Classic WAP and `packages.config` | Can the project still build on `net48` after structural conversion? |
| Configuration migration | LocalDB and ordinary ASP.NET settings | Which values are environment-specific or sensitive? |
| API remediation | `System.Web` concentrated in a few files | Which changes are mechanical, and which alter behavior? |

The product's recommendation is a hypothesis. Amend it when its assumptions differ from your decision record.

## 4. Require an execution-ready task order

A robust BookCatalog plan should contain these semantic stages even if the generated names differ:

| Order | Task | Required completion evidence |
|---|---|---|
| 1 | Baseline and prerequisites | Legacy build plus saved behavior-contract result |
| 2 | SDK-style conversion on `net48` | Project still builds; no behavioral intent changed |
| 3 | ASP.NET Core and .NET 10 migration | Hosting, routing, filters, controller, views, configuration, static assets, and error handling reviewed |
| 4 | EF strategy execution | Context lifetime, async operations, seed behavior, and schema approach reviewed |
| 5 | Final validation | Clean build plus complete behavior contract |

Add or edit tasks so that:

- each task has an objective done condition;
- generated code is reviewed before the next task;
- the task names the files likely to change;
- rollback is a commit, not a vague promise;
- package removal follows source migration;
- anti-forgery, validation, edit allow-list, seed data, and User-Agent behavior are explicit;
- `EnsureCreated()` is identified as either a disposable-lab choice or replaced by migrations; and
- Azure deployment is not included in the runtime-upgrade plan.

## 5. Review the recorded plan as evidence, not a template

One course run produced five tasks:

![Recorded upgrade plan summary with an all-at-once strategy and five reviewable tasks](images/plan-summary.png)

Your plan can differ. Judge it using these questions:

- Does the SDK conversion stay on `net48` long enough to isolate project-format failures?
- Does the ASP.NET task describe source and hosting replacements rather than "absorbing" MVC 5 packages?
- Does the EF task acknowledge behavior and schema risk?
- Does every task run the smallest relevant build or behavior check?
- Is a failed check a stop condition?
- Does the final task verify more than compilation and one page load?

## 6. Approve with an explicit review gate

When the plan reflects your decision record, enter:

> Approve this reviewed plan. Execute only the first task, remain in Guided mode, and pause after the task completes so I can inspect its diff and verification evidence.

Commit:

- the annotated assessment;
- the decision record;
- generated options and plan files; and
- the baseline behavior result or a reference to where it is stored.

The next chapter assumes this commit is the rollback point.

## Transfer exercise

Revise your decision record for a 20-project application with years of EF migration history, zero-downtime requirements, and a public API that cannot change. Which task must move earlier, and which work should become side-by-side?

## References

- [GitHub Copilot upgrade concepts](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/concepts)
- [Customize an upgrade](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/customization)
- [Custom upgrade instructions](https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/how-to-custom-upgrade-instructions)
- [EF6 to EF Core porting](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)

**[Continue to Chapter 03: Upgrade execution](../03-upgrade-execution/README.md)**

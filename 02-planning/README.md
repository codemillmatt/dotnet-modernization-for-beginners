# Chapter 02: Customization and planning decisions

## Outcomes

You will:

- customize flow, scope, source control, framework, packages, validation, and
  cloud constraints;
- compare a plausible default plan with a safer customized plan;
- reorder, split, defer, and reject tasks with evidence;
- define dependency, acceptance, rollback, ownership, and approval gates.

## State contract

- **Start:** Reviewed Chapter 01 assessment and passing baseline tests.
- **End:** `upgrade-options.md`, `plan.md`, and `tasks.md` approved for execution.
- **Known-good end:** `checkpoints/02-planning`.
- **Verify:** No source changes; every task has dependencies, acceptance,
  rollback, validation, owner, and deferred-work treatment.
- **Reset/resume:** `.\scripts\Reset-Course.ps1 -Checkpoint 01-assessment` to
  start, or `-Checkpoint 02-planning` for the model end.
- **If output differs:** Use [the output guide](../docs/OUTPUT-DIFFERS.md).

## 1. Explain: customization is risk control

Automatic Mode is useful for experienced teams with strong tests and
straightforward changes. Guided Mode is safer for learning and high-uncertainty
systems because it pauses at stage boundaries.

Before continuing the agent, supply these constraints:

| Decision | Questions to answer |
|---|---|
| Project/solution scope | Are dependencies and tests included? Is side-by-side required? |
| Target framework | Stable target? SDK policy? Mixed-target transition needed? |
| Source control | Dedicated branch, clean tree, per-task commits, protected paths? |
| Assessment edits | What context, false positives, false negatives, or annotations must be added? |
| Task design | Which tasks must be reordered, split, deferred, or rejected? |
| Architecture/conventions | Authentication, layering, coding rules, approved libraries? |
| Framework/packages | Keep EF6 temporarily or port EF Core? Package dispositions? |
| Validation | Which behavior, data, security, performance, and rollback evidence is mandatory? |
| Cloud | Hosting, IaC, identity, region, SKU, networking, operations, and policy constraints? |

## 2. Predict: compare two plans

Predict the risks of:

- upgrading MVC and EF in one task;
- excluding the test project;
- converting the web project before its dependency;
- allowing runtime schema creation;
- accepting “all findings fixed” as validation.

Write a default-versus-customized comparison before seeing the agent's
recommendation.

## 3. Perform: steer planning

Resume the Guided session and answer strategy questions. For this course:

- include Core, Web, and tests;
- keep the branch and per-task commit policy;
- choose stable .NET 10;
- isolate project structure, ASP.NET Core, and EF Core changes;
- require the same behavior contract at each gate;
- require checked-in EF migrations applied by a deployment identity;
- require reviewed Bicep but defer provisioning until Chapter 06.

Edit `assessment.md` directly when evidence needs correction. Ask the agent to
regenerate affected options rather than silently accepting stale assumptions.

Continue until these files exist under `.github/upgrades/dotnet-version-upgrade/`:

- `upgrade-options.md`;
- `plan.md`;
- `tasks.md`;
- per-task scope and progress files if the agent version produces them.

## 4. Inspect: challenge the plan

Use `../templates/upgrade-plan.md`. A safe BookCatalog sequence is:

1. baseline and branch gate;
2. dependency target transition;
3. project/package structure;
4. ASP.NET Core startup, routing, controllers, configuration, Razor, and errors;
5. EF Core behavior and schema lifecycle;
6. final equivalence validation.

Compare with
`../checkpoints/02-planning/artifacts/customized-plan-comparison.md`.

Reject or revise any task that:

- mixes unrelated failure modes;
- lacks a focused test and full-suite test;
- treats finding count as schedule;
- calls `EnsureCreated()` a production migration;
- grants the runtime DDL roles;
- omits data backup, migration, reconciliation, or rollback;
- assumes generated code or infrastructure is correct.

## 5. Validate independently

- Draw the dependency order and confirm tasks respect it.
- Trace every critical assessment risk into a task or explicit deferral.
- Require measurable acceptance and rollback conditions.
- Confirm stakeholders and owners for data, security, platform, and release.
- Run the unchanged legacy suite.
- Inspect `git diff`; planning should not edit application source.

## 6. Troubleshoot a variation

Practice both steering paths:

1. **Reject:** Tell the agent not to combine the MVC and EF ports.
2. **Revise:** Split the task and require full behavior tests after each part.
3. **Defer:** Model a plan that keeps supported EF6 temporarily, with an owner
   and acceptance date for the EF Core port.

Explain which plan is safer for BookCatalog and which would be safer for a
large, high-data-risk system.

## 7. Transfer

Apply the template to a two-project application. Reorder tasks from leaves to
entry point, identify a mixed-target bridge, and define one rollback gate.

## 8. Knowledge check and reflection

1. When is Automatic Mode reasonable?
2. Why does task isolation improve diagnosis and rollback?
3. What makes deferral explicit rather than hidden debt?
4. Which default did you override, and what evidence justified it?

**Learner artifact:** Customized plan with default comparison, acceptance,
rollback, deferred work, ownership, and approvals.

Continue to [Chapter 03: Upgrade execution](../03-upgrade-execution/README.md).

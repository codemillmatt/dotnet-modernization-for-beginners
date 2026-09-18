# Optional instructor companion

The course is self-paced. Learners do not need this companion, a presentation, or an instructor to follow the required path.

Use these notes to prepare demonstrations and review evidence. Link learners to the canonical lessons instead of maintaining a second set of executable instructions.

## Teaching goal

Learners know C#, basic MVC, Visual Studio, NuGet, and Git. They are learning to direct modernization work and judge its results.

The required outcome combines two journeys:

1. Upgrade BookCatalog locally while preserving behavior and two selected records.
2. Assess Azure readiness and revise a migration plan without creating resources.

The repeated sequence is **assess, decide, plan, change, and verify**. An agent transcript is not the learning outcome.

An optional deployment adds approved resource creation, cloud checks, and cleanup. Do not treat subscription access as a prerequisite for the required course.

## Prepare before facilitating

- Follow [Chapter 00](../00-introduction/README.md) on a clean Windows learner environment.
- Check Visual Studio 2026 components and signed-in Copilot access.
- Confirm the legacy app starts without a test-only setup step or empty MDF.
- Create sample records and check persistence across restart.
- Rehearse the bounded helper on isolated SQL Server databases.
- Identify the actual upgrade and Azure artifact locations in your installed product version.
- Keep a completed reference in an isolated database environment, not over the learner's project.
- Use [maintainer validation](validation.md) to separate tested results from pending platform checks.

Do not promise identical issue counts, generated filenames beyond documented conventions, or an agent failure on a particular step.

There is no measured course duration yet. Allocate time for reading, decisions, retries, and inspection, not only command execution.

## Teaching transitions

| Transition | Demonstration or question | Evidence to review |
| --- | --- | --- |
| [Baseline](../00-introduction/README.md#choose-the-records-that-must-survive) | Show an inactive record through its details route | Two actual IDs and a separate throwaway record |
| [Assessment](../01-assessment/README.md#trace-a-finding-into-the-application) | Trace one finding to source before discussing counts | Finding, user impact, action, and check |
| [Requirements](../01-assessment/README.md#tell-the-agent-what-must-survive) | Ask what the agent cannot infer from code | Edited assessment and explicit baseline context |
| [Plan](../02-planning/README.md#change-one-inadequate-plan-step) | Contrast a build-only check with a data check | Learner's plan edit and agent reconciliation |
| [Copy](../03-upgrade-execution/README.md#preview-copy-and-verify-the-selected-records) | Predict what preview will change | No preview writes, explicit apply, exact stored-value result |
| [Recovery](../03-upgrade-execution/README.md#recover-without-discarding-your-work) | Reopen the existing scenario | Correct branch, current incomplete state, and safe next action |
| [Transfer](../03-upgrade-execution/README.md#make-an-independent-change) | Ask for an author filter without revealing the worked approach | Learner-defined checks preserve filtering and order |
| [Azure](../04-cloud/README.md#choose-a-target-with-a-reason) | Compare targets without deploying | Target-specific finding and reasoned hosting choice |
| [Cloud plan](../04-cloud/README.md#edit-and-reconcile-the-cloud-plan) | Ask who performs schema changes and who runs the app | Edited plan with distinct identities and approval boundaries |

## Common misconceptions

### A successful build proves the upgrade

Ask learners to name one compiled change that could damage behavior. The edit action's treatment of `CreatedDate` is a useful example.

Keep compilation, HTTP behavior, SQL Server behavior, and stored-value comparisons separate.

### Seed data proves preservation

Show that both databases can display the same seed titles without sharing learner-created records.

Require the original selected IDs and all stored fields, including nulls and full timestamps.

A date-only details page cannot prove precision. The exported source snapshot is the comparison input.

### Every record is safe to edit during a test

Keep the two carry-forward records stable. Demonstrate edits, validation, inactive/restore behavior, and deletion on another record.

If a learner changes a stable record, investigate against the source snapshot. Do not silently redefine the baseline after the upgrade.

### All generated Markdown is the same kind of artifact

Requirements and plans describe intent. Task specifications describe work. Progress files report execution state.

Learners can revise intent and acceptance conditions. They must not manufacture success by marking unfinished tasks complete.

### The Azure journey repeats the framework assessment

Use **Modernize > Migrate to Azure**. Compare a hosting or configuration finding with an earlier API-compatibility finding.

The Visual Studio Azure artifact locations differ from the upgrade scenario directory. Verify the actual generated files.

### The app needs migration permissions

The runtime managed identity reads configuration and performs application data operations. The approved administrator prepares schema and copies selected records.

Granting schema permissions to the runtime app does not fix a bad deployment sequence.

### A separate clone isolates the database

Both the completed reference and learner target default to `BookCatalogModernizedLab`. Use an isolated environment for the reference when that database contains learner work.

## Recovery without losing learner decisions

For setup failures, preserve the original error. Check the documented prerequisites before changing source.

For unexpected agent edits, inspect the diff and restate the agreed boundary. Do not reset over unrelated work.

For a data conflict, inspect the IDs and target. Do not overwrite rows, change IDs, or delete a database to force a pass.

For an interrupted task, use its actual progress details and last successful check. Reconcile the next action with the plan.

For unavailable Azure access, finish the required assessment and plan. Record deployment as **Not run**.

For a paid-lab failure, maintain cleanup ownership even if application checks fail. Cleanup evidence does not turn a failed deployment into a successful one.

## Review understanding, not only output

Ask the learner to show one complete chain:

**Observed need → assessment requirement → plan action → implemented change → recorded check.**

Then change one assumption verbally. For example, ask whether a large EF6 data layer should move to EF Core in the same group.

Accept a reasoned different choice when the learner explains support, scope, and checks. Do not require a memorized answer.

Core completion requires [all five chapter outcomes](../README.md#course-structure), including the reviewed Azure plan. Paid deployment is not part of that count.

## Optional deployment facilitation

Use the [deployment procedure](../04-cloud/deployment.md) only after scope and cost approval.

Confirm the subscription, region, budget, identities, and owner before login or provisioning. Warn that the sample website is public and unauthenticated.

Review the broad Azure-services firewall rule and the temporary client rules. Do not loosen them during a demonstration to hide an access error.

Ensure learners use their actual upgraded application and original snapshot. End with scoped resource-group cleanup and a recorded result.

## Pilot questions

These are proposed learner checks, not claims that a pilot has occurred:

- Can a learner find the next action without reading this companion?
- Can they explain why the assessment needs their baseline context?
- Can they distinguish preview, apply, and verify?
- Can they identify a lost requirement after agent reconciliation?
- Can they make the author-filter change before opening the worked approach?
- Can they finish cloud planning without an Azure account?

Record observed difficulties and revise the affected lesson. Automated tests do not establish learner understanding.

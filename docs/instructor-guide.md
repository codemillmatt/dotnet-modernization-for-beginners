# Optional instructor companion

The course is self-paced. Learners don't need this companion, a presentation, or an instructor to follow the required path.

Use these notes to prepare demonstrations. Link learners to the canonical lessons instead of maintaining a second set of executable instructions.

## Teaching goal

Learners know C#, basic MVC, Visual Studio, NuGet, and Git. They're learning GitHub Copilot's .NET modernization tooling in Visual Studio.

The required outcome combines two journeys:

1. Use the modernization agent through Copilot Chat to assess, plan, and upgrade BookCatalog to .NET 10, then run the app.
2. Assess Azure readiness and revise a migration plan without creating resources.

The required path has six steps: introduction, Setup, assessment, planning, execution, and Azure planning.

Keep the focus on the tool: read its assessment, generate a plan, review the choices, add a requirement, and run the result.

Keep an adequate assessment as-is. Learners can add context manually or through the modernization agent, but an edit isn't a completion requirement.

Use an in-place rewrite to ASP.NET Core MVC on .NET 10 with EF Core. Replace the old host rather than running both hosts.

Don't add a shared schema, YARP, or System.Web adapters. The app's demo data can be rebuilt through EF Core.

Use `BookCatalogModernizedLab`. Recreate it when needed, but don't reset it on every startup.

The explicit plan requirement is: add a book, edit it, restart the app, and confirm the saved edit remains.

Offer optional exercises without turning them into hidden completion criteria. Data preservation isn't part of the required outcome.

Optional deployment adds approved resource creation, cloud checks, and cleanup. Subscription access isn't a prerequisite for the required course.

## Prepare before facilitating

- Follow [the introduction](../00-introduction/README.md), then [Setup](../prerequisites/README.md) on a clean Windows learner environment.
- Check Visual Studio 2026 components and signed-in Copilot access.
- Accept a stable .NET SDK 10 or later. Keep the .NET 10 runtime components installed because the upgraded app targets .NET 10.
- Confirm the legacy app starts without a test-only setup step or empty MDF.
- Create sample records and check persistence across restart.
- If teaching standalone data transfer, use that exercise's own legacy clone. Don't assume the core learner copy retains earlier records.
- Identify the actual upgrade and Azure artifact locations in your installed product version.
- Keep completed-reference code separate from learner code. Stop the learner app before running the reference against the same demo database.
- Use [maintainer validation](validation.md) to separate tested results from pending platform checks.

Use the [curated BookCatalog example](../examples/assessments/bookcatalog/README.md) for recorded observations. Keep its excerpts distinct from instructor explanation.

Don't promise identical issue counts, generated filenames beyond documented conventions, or an agent failure on a particular step.

Use the installed product's actual stage boundaries. Don't require a task file before the modernization agent creates it.

Open `shared-legacy-app\BookCatalog.sln` in Visual Studio. Use Copilot Chat for the agent's prompts, beginning each pasted request with `@Modernize`.

Typing `@Modernize` can show **@Modernize Run an assessment for BookCatalog** and open the **Upgrade Agent Dashboard**.

Send the contextual assessment prompt from Chapter 01. Approve repository inspection and assessment permissions when requested.

Visual Studio opens the assessment automatically. Use that report and the dashboard to explain the findings.

In Chapter 02, generate the plan first. Then review the proposed choices before authorizing implementation.

Use the chapter's prompt beginning `@Modernize create plan.md for .NET 10 migration`. Keep its explicit in-place, EF Core, and direct-API constraints.

If a proposed choice keeps EF6 or adds a second host, change it to the required course approach.

Keep the assessment and reviewed plan for later team or management discussions.

There is no measured course duration yet. Allocate time for reading, decisions, retries, and inspection, not only command execution.

## Teaching transitions

| Transition | Demonstration or question | Evidence to review |
| --- | --- | --- |
| [Setup](../prerequisites/README.md#run-bookcatalog) | Add a sample book with **Active** selected, then edit it | Working app and available Copilot entry point |
| [Assessment](../01-assessment/README.md) | Read a relevant report section and decide whether it needs more context | Correct app/target and a reviewed assessment |
| [Plan](../02-planning/README.md) | Generate the plan, review its choices, then add the add/edit/restart requirement | In-place .NET 10 and EF Core plan, with execution still unapproved |
| [Execution](../03-upgrade-execution/README.md) | Review representative project, startup, or controller changes | Learner's own app runs and its saved edit survives restart |
| [Recovery](../03-upgrade-execution/README.md#recover-without-discarding-your-work) | Reopen the existing scenario | Correct branch, current incomplete state, and safe next action |
| [Azure](../04-cloud/README.md) | Read the report, choose a relevant task, and edit its plan | Assessment and updated migration plan, without resource creation |

## Offer optional work at the right time

- [Data transfer](data-transfer.md) is a standalone import exercise, not a required upgrade task.
- [Advanced checks](advanced-checks.md) cover actual server requests, antiforgery, and stored timestamps. Use disposable records.
- [Author filter](author-filter.md) offers independent feature practice after the local app works.
- [Learner record](learner-record.md) is a detailed workbook for learners who want it.
- [Deployment](../04-cloud/deployment.md) prepares EF Core schema and seeds, then tests a new cloud record.

Keep these branches skippable. An instructor demonstration doesn't create a new learner prerequisite.

## Common misconceptions

### A successful build proves the upgrade

Run the upgraded app and try its forms. For an optional deeper discussion, use the edit action's treatment of `CreatedDate`.

Keep compilation, HTTP behavior, SQL Server behavior, and stored-value comparisons separate.

### Seed data proves preservation

Explain that EF Core seeds a new demo catalog. Repeated titles don't mean the app copied legacy records.

The core outcome is a working upgraded app, not a record-preservation result.

### Every record is safe to edit during a test

Use sample records for experiments. Keep a record until its add/edit/restart check is complete, then delete it if you want.

Explicit imports have their own conflict and verification rules in the standalone reference.

### All generated Markdown is the same kind of artifact

Requirements and plans describe intent. Task specifications describe work. Progress files report execution state.

Learners can revise intent and acceptance conditions. They must not manufacture success by marking unfinished tasks complete.

### The Azure journey repeats the framework assessment

Use **Modernize > Migrate to Azure**. Compare a hosting or configuration finding with an earlier API-compatibility finding.

The Visual Studio Azure artifact locations differ from the upgrade scenario directory. Verify the actual generated files.

### The app needs migration permissions

The runtime managed identity reads configuration and performs application data operations.

The approved administrator prepares the cloud schema and seeds.

Granting schema permissions to the runtime app does not fix a bad deployment sequence.

### A separate clone isolates the database

Both the completed reference and learner app default to `BookCatalogModernizedLab`. Stop one app before running the other.

If their schemas differ, recreate the disposable demo database for the app you're testing. This isn't a side-by-side or shared-schema migration.

## Recovery without losing learner decisions

For setup failures, preserve the original error. Check the documented prerequisites before changing source.

For unexpected agent edits, inspect the diff and restate the agreed boundary. Do not reset over unrelated work.

For an incompatible local demo schema, let EF Core rebuild and seed `BookCatalogModernizedLab`. Repeat the add/edit/restart check afterward.

Don't leave unconditional deletion or reseeding in startup code. Restart must keep the edit saved during the check.

For an interrupted task, use its actual progress details and last successful check. Reconcile the next action with the plan.

For unavailable Azure access, finish the required assessment and plan. Record deployment as **Not run**.

For a paid-lab failure, maintain cleanup ownership even if application checks fail. Cleanup evidence does not turn a failed deployment into a successful one.

## Review understanding, not only output

Ask the learner to explain a plan choice and show the add/edit/restart requirement. Inspect the artifact, not only chat's acknowledgement.

Don't require a written evidence chain for every finding.

For a deeper discussion, change one assumption verbally. For example, ask whether a large EF6 data layer should move to EF Core in the same group.

Accept a reasoned different choice for that larger application. Keep this lab's implementation in place with EF Core.

Core completion requires [all six steps](../README.md#course-structure), including Setup and the reviewed Azure plan. Optional material doesn't count toward required completion.

## Optional deployment facilitation

Use the [deployment procedure](../04-cloud/deployment.md) only after scope and cost approval.

Confirm the subscription, region, budget, identities, and owner before login or provisioning. Warn that the sample website is public and unauthenticated.

Review the broad Azure-services firewall rule and the temporary client rules. Do not loosen them during a demonstration to hide an access error.

Use the learner's actual upgraded application. Basic deployment prepares schema and seeds, then checks a new disposable cloud record.

End with scoped resource-group cleanup and an observed result, even if application checks fail.

## Pilot questions

These are proposed learner checks, not claims that a pilot has occurred:

- Can a learner find the next action without reading this companion?
- Can they find the setup shortcut when their tools are already installed?
- Can they explain why they kept or changed the assessment?
- Can they identify the required choices and add/edit/restart check in the generated plan?
- Does their saved edit survive an app restart?
- If they choose data transfer, can they distinguish preview, apply, and verify?
- If they choose the author-filter challenge, can they attempt it before opening the worked approach?
- Can they finish cloud planning without an Azure account?

Record observed difficulties and revise the affected lesson. Automated tests do not establish learner understanding.

<a id="chapter-04-prepare-for-azure"></a>
# Chapter 04: Assess and plan for Azure

Your local upgrade works. Now decide what must change before the same application can run in Azure.

This chapter is **required**. Its result is an Azure assessment and a revised migration plan, not a deployed application.

Start with the verified app, selected-record snapshot, and learner record from [Chapter 03](../03-upgrade-execution/README.md).

You need Visual Studio and Copilot access from Chapter 00. You do **not** need Node, Azure CLI, an Azure login, or an Azure subscription.

## What changes when the app moves?

The web framework is already modernized. Azure planning now concerns hosting, database access, configuration, identity, data, and operations.

The LocalDB database runs on your Windows machine. Moving web files to Azure does not move that database or its records.

| Component | Role in this example | What you must plan |
| --- | --- | --- |
| Azure App Service | Hosts the web application | Runtime support, application settings, deployment, and diagnostics |
| Azure SQL | Stores the cloud `Books` table | Schema preparation, selected-record copy, and database permissions |
| Azure Key Vault | Supplies the connection setting | Configuration loading and access permissions |
| User-assigned managed identity | Lets the running app access supported Azure services | Identity binding and limited runtime permissions |
| Developer/administrator identity | Prepares resources, schema, and selected data | Separately approved access, costs, and cleanup |

A managed identity avoids storing an application password for supported service access. It does not authenticate BookCatalog's website users.

Key Vault supplies configuration. It is not between the application and every SQL request.

![Proposed Azure architecture: a public sample user reaches BookCatalog on App Service. Its runtime managed identity authorizes Key Vault and Azure SQL access. A separate approved administrator sets up the schema and copies selected records.](../docs/illustrations/azure-light.svg)

The optional lab is publicly accessible and has no application-user authentication. Its plan must restrict it to disposable sample data.

## Ask the agent for cloud-readiness findings

Open your **upgraded learner solution** in Visual Studio, not the completed reference.

1. Right-click the solution in Solution Explorer.
2. Select **Modernize**.
3. Select **Migrate to Azure** in Copilot Chat.
4. Send that option to start the assessment.

The equivalent chat entry is `@Modernize Migrate to Azure`. Use this Azure workflow, not another framework-upgrade assessment.

Assessment normally starts automatically. Keep application remediation and resource creation unapproved.

Attach your local verification notes and requirements. Send:

```text
Assess this upgraded BookCatalog application for Azure.
Use my attached requirements and local verification results.
Do not change application code, sign in to Azure, create resources, or deploy.
Identify the assessment configuration and report locations.
Explain target-specific findings with their source locations.
Keep unresolved access and cost assumptions in the plan, not as actions.
```

Check each permission request. Decline or stop commands outside assessment and planning.

If the agent requests subscription access for deployment discovery, restate the planning-only scope. Use explicit assumptions instead of inventing an approved subscription.

## Compare the report with the real application

Current Visual Studio documentation puts assessment configuration under `.appmod\.appcat`. A typical configuration file is `assessment-config.json`.

The first assessment creates configuration automatically. Ask the agent to identify its actual path rather than creating a guessed file beforehand.

The report may show **Application Information**, **Issue Summary**, and **Issues**. Check the solution, framework, and selected Azure target first.

Azure report criticality differs from the framework-compatibility categories in Chapter 01:

| Azure criticality | How to use it |
| --- | --- |
| Mandatory | Investigate a change required for the assessed migration |
| Potential | Review whether the issue applies to this application |
| Optional | Consider the benefit and scope before choosing it |

These labels do not replace source inspection or your business requirements.

Expand a real issue. Follow its file and line reference. Record the current behavior, proposed action, and evidence you would need after the change.

For example, inspect the effective LocalDB connection and automatic initialization in `Program.cs`. Explain why they need different treatment on Azure.

If the report omits that issue, record it as your own finding. Do not invent a report entry or change counts to match this lesson.

## Choose a target with a reason

An assessment configured with `Any` can compare supported compute targets in the report. A target-specific assessment shows that target's findings.

Inspect the generated configuration. If comparison will help your decision, ask the agent to assess `Any` or the alternative you want to compare.

For the supplied deployment path, choose **App Service on Linux** with Azure SQL. The documented assessment target value is `AppService.Linux`.

To focus a later assessment, edit the existing configuration's `appcat.target` value. Preserve its other settings.

This fragment shows the relevant structure, not a command or a replacement for an unrelated configuration file:

```json
{
  "appcat": {
    "target": "AppService.Linux"
  }
}
```

Rerun the assessment after saving a configuration change. Confirm that the report names the target you selected.

| Option | Why consider it? | Additional responsibility |
| --- | --- | --- |
| App Service on Linux | Fits this .NET 10 web app without adding container packaging | Check supported runtime, settings, diagnostics, and SQL access |
| App Service on Windows | Relevant when a workload retains Windows-specific dependencies | Identify the dependency that justifies that choice |
| Azure Container Apps | Useful when container packaging is a deliberate requirement | Own the image, registry, container configuration, and operating model |

Do not select a target only because it reports fewer issues. Record why its responsibilities fit this application.

The supplied optional lab uses App Service, Azure SQL, Key Vault, and a user-assigned managed identity. A different target needs a separately reviewed deployment procedure.

<div class="activity">

### Your decision: what finding changes the plan?

Choose one target-specific finding from your report. Trace it to source.

Explain its effect on configuration, data access, or hosting. State one alternative and why you did not choose it.

</div>

<details>
<summary>Compare your reasoning</summary>

A LocalDB connection cannot provide the cloud database. Replacing its server name alone does not create schema, copy records, or authorize the running app.

The plan needs separate actions for those responsibilities. A successful web deployment proves none of them by itself.

</details>

## Generate a migration plan without executing it

The assessment can recommend migration tasks. Select the actual task that addresses your chosen finding.

In Visual Studio, **Run Task** or the task's name in chat starts its migration workflow. Request a plan and a review boundary before remediation.

Replace the placeholder with a task title from your own report:

```text
Prepare the plan for <actual-migration-task-title>.
Do not start code remediation or Azure operations.
Include the wider BookCatalog dependencies needed for App Service on Linux,
Azure SQL, Key Vault, and a user-assigned managed identity.
Use my baseline requirements and the selected-record snapshot.
Identify the generated plan and progress files.
Stop for review when the plan is ready.
```

Current Visual Studio documentation describes `.appmod\.migration\plan.md` and `.appmod\.migration\progress.md`.

These are not the framework-upgrade scenario files under `.github\upgrades\{scenarioId}`. Verify the files your installed agent actually creates.

The plan defines intended work. Progress records execution state. Inspect the latter, but do not mark unrun tasks complete.

## Edit and reconcile the cloud plan

Open your generated migration plan. Add a **BookCatalog lab requirements** section, or revise the existing sections that own these decisions.

Make the following requirements explicit:

| Requirement | Planned action | Evidence or approval needed |
| --- | --- | --- |
| Preserve selected data | Apply schema, then copy the original `.bookcatalog-lab\books.json` to `BookCatalogLab` | Same selected IDs, values, nulls, `IsActive`, and stored `CreatedDate` |
| Preserve local work | Keep the legacy database and `BookCatalogModernizedLab` unchanged | Reviewed connections and separate cloud target |
| Use the chosen host | Prepare the learner app for App Service on Linux | Local checks and a reviewed runtime/deployment configuration |
| Separate identities | Administrator prepares schema and data. Runtime identity handles application reads/writes | No schema-change permissions for the runtime app |
| Load configuration safely | Read the connection setting from Key Vault only when configured | Local run without Azure access and cloud identity/configuration checks |
| Bound access and cost | Use an approved dedicated group, region, budget, and sample data | Separate approval before login, provisioning, or deployment |
| Verify and diagnose | Check actual HTTP behavior, stored values, restart persistence, and logs | Recorded results, not only HTTP 200 |
| Recover and clean up | Define failed-deployment recovery and resource ownership | No source overwrite, no database deletion shortcut, and scoped cleanup confirmation |

Use your actual two IDs in the data requirement. Creating seed records is not a substitute for copying those records.

If the plan already covers every row, improve one acceptance condition with a concrete observation. Explain why your edit makes completion easier to judge.

For recovery, distinguish restoring a previous application package from restoring database state. Redeploying code does not undo data changes.

Ask the agent to reconcile your edits:

```text
Read the BookCatalog requirements I added to the migration plan.
Reconcile the proposed actions, dependencies, and acceptance conditions.
Show the plan change for each requirement and identify unresolved assumptions.
Keep execution progress truthful. Do not mark unrun cloud tasks complete.
Do not remediate, provision, or deploy.
```

Compare the changed plan with your edits. Record one requirement-to-action-to-check link in your learner record.

Inspect the pending diff from the repository root:

```powershell
git status --short
git diff
```

Expect assessment, configuration, and plan artifacts. Investigate any unexpected application changes.

Save only reviewed, nonsecret artifacts in your checkpoint. Do not stage local snapshots or deployment outputs.

## Finish the required course

You are ready to mark Chapter 04 complete when you can show:

- A real Azure assessment for your upgraded app and chosen target.
- A target-specific finding traced to source.
- A hosting choice and a reasoned alternative.
- Your edit to the generated migration plan and the agent's reconciliation.
- Data, identity, cost, verification, recovery, and cleanup requirements.
- No unapproved code remediation or Azure resource creation.

You have now used the same process for a framework upgrade and a cloud migration plan. The next application will need its own requirements and evidence.

Deployment is optional. Leave its learner-record section **Not run** if you stop here.

**[Optional: deploy the reviewed plan](deployment.md)** · **[Course overview](../README.md)**

## Earlier deployment links

The detailed deployment procedure has moved. Existing chapter links still lead to the corresponding optional steps below.

<a id="check-tools-access-and-costs-first"></a>
Use [deployment access and cost checks](deployment.md#check-tools-access-and-costs-first) only if you choose the optional lab.

<a id="prepare-the-application-explicitly"></a>
Continue with [reviewed application preparation](deployment.md#prepare-the-application-explicitly).

<a id="produce-a-schema-from-your-application"></a>
See [schema generation](deployment.md#produce-a-schema-from-your-application).

<a id="review-the-infrastructure"></a>
See [infrastructure review](deployment.md#review-the-infrastructure).

<a id="your-review-what-can-each-identity-do"></a>
Use the [identity review activity](deployment.md#your-review-what-can-each-identity-do).

<a id="provision-the-dedicated-lab"></a>
See [dedicated-group provisioning](deployment.md#provision-the-dedicated-lab).

<a id="apply-the-schema-and-application-permissions"></a>
See [schema and runtime permissions](deployment.md#apply-the-schema-and-application-permissions).

<a id="publish-your-learner-application"></a>
See [deployment of your learner application](deployment.md#publish-your-learner-application).

<a id="delete-the-dedicated-lab-group"></a>
See [scoped cleanup](deployment.md#delete-the-dedicated-lab-group).

## Reference

- [Visual Studio Azure assessment and migration workflow](https://learn.microsoft.com/dotnet/azure/migration/appmod/quickstart?pivots=visualstudio)
- [Assessment configuration and report interpretation](https://learn.microsoft.com/dotnet/azure/migration/appmod/working-with-assessment)
- [Optional Azure support files](../examples/azure/README.md)

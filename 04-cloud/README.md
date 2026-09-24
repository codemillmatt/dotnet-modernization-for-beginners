<a id="chapter-04-prepare-for-azure"></a>
# Chapter 07: Assess and plan for Azure

Your upgraded app runs locally. Now use Visual Studio's Azure modernization workflow to find what must change before it can run in Azure.

Open `shared-legacy-app\BookCatalog.sln`, containing the app you upgraded in Chapter 06.
The result of this chapter is an Azure assessment and an edited migration plan.
**Don't create Azure resources or deploy the app in this chapter.**

Use the Visual Studio installation and Copilot account from Setup.
You don't need Azure CLI, Node, or an Azure subscription for this planning path.

## What changes when the app moves?

LocalDB runs on your Windows machine. Uploading the web application wouldn't move that database with it.

Use these components as the proposed target:

| Component | Responsibility |
| --- | --- |
| Azure App Service on Linux | Host the .NET 10 web app |
| Azure SQL | Store the cloud book catalog |
| Azure Key Vault | Supply the configured connection setting |
| Managed identity | Give the running app access to supported Azure services without an application password |

A managed identity doesn't sign users into BookCatalog. The optional sample is publicly accessible and has no application-user authentication.
Use disposable sample data only.

![BookCatalog runs on App Service, uses its managed identity for Key Vault and Azure SQL, and has separately approved administrator setup.](../docs/illustrations/azure-light.svg)

## Ask the agent for cloud-readiness findings

Stop debugging. Open a new Copilot Chat for the Azure workflow.

Right-click the solution and select **Modernize > Migrate to Azure**.
You can also start from Copilot Chat with this request:

```text
@Modernize Migrate to Azure.
Assess this upgraded BookCatalog application only.
Do not change application code, sign in to Azure, create resources, or deploy.
Identify the assessment report and configuration locations.
Stop after assessment.
```

This is the Azure workflow, not another .NET framework upgrade.
If the menu starts the assessment automatically, wait for its report.
Otherwise, use the request above to start the assessment.

Approve requests to inspect the local application for assessment.
If the tool requires Azure sign-in or resource creation, stop and record the exact message.
Those actions aren't part of this chapter.

## Compare the report with the real application

Open the report from the assessment results.
If you can't find it, ask the agent to show the report's path and open it.
Look for **Application Information**, **Issue Summary**, and **Issues**, or equivalent headings.
First check that the report names your upgraded BookCatalog project.

Expand one issue about configuration, hosting, or database access.
Read its explanation and recommended migration task.
Identify the application setting or code that the task would change.

For example, a local database connection needs a cloud database and a different access configuration.
If your report doesn't identify a LocalDB issue, ask the agent how the current connection will work on App Service.
Keep its answer separate from the report's actual findings.

Report criticality labels such as **Mandatory**, **Potential**, and **Optional** help you review findings.
They aren't instructions to execute every suggested task.

## Choose a target with a reason

Use **App Service on Linux** for the Azure design.
It fits the .NET 10 web application without adding container packaging.

Visual Studio documentation places assessment configuration under `.appmod\.appcat`, often in `assessment-config.json`.
Ask the modernization agent to open the configuration file and show the selected target.

If the target isn't `AppService.Linux`, ask the agent to select that target and rerun the assessment.
Check that the new report names App Service on Linux.

## Generate a migration plan without executing it

Choose one recommended migration task from your report and copy its title.
Use chat to request a plan. Don't select **Run Task** if that action would immediately change the application.

Keep the planning-only boundary explicit. Replace the placeholder below with the task's actual title:

```text
@Modernize Prepare the plan for <actual-migration-task-title>.
Plan for BookCatalog on App Service on Linux with Azure SQL.
Include the configuration and identity dependencies the task needs.
Identify the generated plan and progress files.
Do not remediate application code, sign in, provision, or deploy.
Stop when the plan is ready for review.
```

Ask the agent to open the files it created.
Visual Studio documentation describes `.appmod\.migration\plan.md` and `progress.md`.
Use the paths from your run. These aren't the framework-upgrade files under `.github\upgrades`.

If the tool starts execution instead of offering a planning boundary, stop it and inspect the pending changes.
Don't approve remediation to make the instructions appear to work.

## Edit and reconcile the cloud plan

Open the Azure migration `plan.md`, not the .NET upgrade plan from Chapter 05.
Find the configuration or validation section and add:

```text
Keep local BookCatalog development working without Azure access.
Keep LocalDB for local runs. Use Azure SQL for the proposed cloud deployment.
Before any future deployment, require separate approval for the
subscription, dedicated resource group, region, budget, and cleanup owner.
Create the cloud schema from the EF Core model and use demo seed data.
After deployment, check the app by adding and editing a new sample book.
```

Save the file and ask:

```text
@Modernize Read the requirements I added to the Azure migration plan.
Update its configuration, deployment, and validation steps to include them.
Show the changed steps.
Leave unrun work pending. Do not remediate, provision, or deploy.
```

Read the changed sections.
Check that the plan keeps local runs on LocalDB and uses the EF Core model to create the proposed cloud schema.
Deployment must still require separate approval.

## Finish the required course

Finish this chapter when you have the Azure assessment and a migration plan that includes your saved requirements.

You've used the modernization agent to assess, plan, and upgrade an application, then prepare its cloud plan.
Keep the reports and plans so you can review the decisions with your team.

**[Course overview](../README.md)**

<details>
<summary>Earlier activities and deployment links</summary>

<a id="your-decision-what-finding-changes-the-plan"></a>
Use [the report review](#compare-the-report-with-the-real-application) to choose a relevant task. A source-tracing table and alternative-target essay aren't required.

<a id="earlier-deployment-links"></a>
<a id="check-tools-access-and-costs-first"></a>
See [deployment access and cost checks](deployment.md#check-tools-access-and-costs-first).

<a id="prepare-the-application-explicitly"></a>
See [application preparation](deployment.md#prepare-the-application-explicitly).

<a id="produce-a-schema-from-your-application"></a>
See [schema generation](deployment.md#produce-a-schema-from-your-application).

<a id="review-the-infrastructure"></a>
See [infrastructure review](deployment.md#review-the-infrastructure).

<a id="your-review-what-can-each-identity-do"></a>
See [identity review](deployment.md#your-review-what-can-each-identity-do).

<a id="provision-the-dedicated-lab"></a>
See [dedicated-group provisioning](deployment.md#provision-the-dedicated-lab).

<a id="apply-the-schema-and-application-permissions"></a>
See [schema and runtime permissions](deployment.md#apply-the-schema-and-application-permissions).

<a id="publish-your-learner-application"></a>
See [deployment of your learner application](deployment.md#publish-your-learner-application).

<a id="delete-the-dedicated-lab-group"></a>
See [scoped cleanup](deployment.md#delete-the-dedicated-lab-group).

</details>

## Reference

- [Visual Studio Azure assessment and migration workflow](https://learn.microsoft.com/dotnet/azure/migration/appmod/quickstart?pivots=visualstudio)
- [Assessment configuration and report interpretation](https://learn.microsoft.com/dotnet/azure/migration/appmod/working-with-assessment)
- [Optional Azure support files](../examples/azure/README.md)

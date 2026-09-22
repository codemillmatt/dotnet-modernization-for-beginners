# Reading an example assessment

`simple-legacy-app` preserves a recorded assessment of the optional console sample. Its fields, paths, counts, and suggested changes describe that recording.

They aren't a current product schema or an expected BookCatalog result.

These files previously lived at `.github\upgrades\scenarios\dotnet-version-upgrade`. They are reference material, not an active upgrade.

Historical GitHub links to a specific commit remain unchanged. Do not copy these files into a live scenario or change their checkmarks to represent your progress.

## Use it as a comparison

First, run an assessment on your own solution. Ask the agent to identify the actual file.

Current upgrade documentation uses `.github\upgrades\{scenarioId}\assessment.md`. Confirm that the report identifies the solution you opened.

Compare how a finding identifies source and impact. Do not compare issue counts as a measure of success.

For BookCatalog, [review the assessment](../../01-assessment/README.md#read-the-report-in-a-useful-order) and add requirements only if needed.
Then review the agent's proposed upgrade plan.

Visual Studio's Azure workflow uses different artifacts, including `.appmod\.appcat` and `.appmod\.migration`. This console recording is not an Azure planning template.

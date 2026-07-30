# Chapter 01: Assessment and evidence interpretation

This chapter assesses BookCatalog only. Planning begins in Chapter 02 and source
changes begin in Chapter 03.

## Outcomes

You will:

- establish a tested, multi-project legacy baseline on a dedicated branch;
- inspect project, package, API, configuration, data, and test evidence;
- triage findings across compatibility, severity, business, exposure,
  confidence, and validation;
- produce an evidence-backed worksheet and prioritized risk register.

## State contract

- **Start:** `shared-legacy-app` with no generated scenario state.
- **End:** Source unchanged; reviewed assessment, worksheet, and risk register.
- **Known-good end:** `checkpoints/01-assessment`.
- **Verify:** Legacy build and nine characterization tests pass; `git diff` shows
  only learner and `.github/upgrades/` artifacts.
- **Reset start:** `.\scripts\Reset-Course.ps1 -Checkpoint legacy-baseline`.
- **Resume end:** `.\scripts\Reset-Course.ps1 -Checkpoint 01-assessment`.
- **If output differs:** Trace evidence and use
  [the output guide](../docs/OUTPUT-DIFFERS.md).

## 1. Explain: assessment boundaries

Assessment inventories modernization evidence. It does not estimate a schedule,
select a final architecture, or prove behavior. BookCatalog now includes:

- a `BookCatalog.Core` dependency;
- an ASP.NET MVC 5/EF6 web project;
- characterization tests covering CRUD, validation, routes/responses, LocalDB
  initialization and seed data, configuration, anti-forgery metadata, errors,
  and the active-book query.

These projects make dependency order and preserved behavior visible.

## 2. Predict: create a hypothesis

Copy `../templates/assessment-worksheet.md` and
`../templates/risk-register.md` into your learner workspace. Predict the
highest-risk evidence in:

- project format and target frameworks;
- `Global.asax`, routes, and filters;
- controller binding, anti-forgery, and errors;
- Razor views;
- `web.config`;
- EF6 initialization, seed data, and query behavior;
- the dependent model and test projects.

Do not predict effort from symbol count.

## 3. Perform: establish evidence and assess

Create a branch and baseline commit before invoking the agent:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint legacy-baseline
Set-Location .\work
git status --short
nuget restore .\BookCatalog.sln
msbuild .\BookCatalog.sln /p:Configuration=Release
dotnet test .\tests\BookCatalog.CharacterizationTests\BookCatalog.CharacterizationTests.csproj --configuration Release
```

If the working tree is not clean, stop and preserve the work safely.

Open `work/BookCatalog.sln`, start **Modernize**, request stable .NET 10 in
Guided Mode, and include the entire solution. Read each command. Stop after
`assessment.md` is generated; do not answer strategy questions yet.

## 4. Inspect: apply the decision matrix

Use this model for representative findings:

| Category | Severity is separate because… | Validation implication |
|---|---|---|
| Binary incompatibility | A low-business-value binary may be removable rather than urgent | Build/load the path that remains |
| Source incompatibility | It can block compilation after retargeting | Retargeted build plus behavior test |
| Behavioral change | It may compile and still be the largest business risk | Characterization, integration, failure, and data tests |

Then evaluate packages with an explicit disposition: keep, upgrade,
framework-provided replacement, replace, defer, or remove. ASP.NET MVC 5
packages are replaced by redesigned ASP.NET Core capabilities; they are not
simply compatible packages to keep.

For each high-risk report row:

1. trace it to source;
2. record all six interpretation dimensions;
3. identify potential false positives and false negatives;
4. cite the test that currently covers it, or register a test gap.

Compare coverage—not wording—with
`../checkpoints/01-assessment/artifacts/assessment.md`.

## 5. Validate independently

- Run the complete legacy test suite again.
- Search source for `System.Web`, EF initialization, configuration, write
  actions, and external calls not explained by the report.
- Confirm no application source changed.
- Confirm the report includes all three projects and the dependency direction.
- Confirm every critical risk has validation and a rollback trigger.

## 6. Troubleshoot a variation

Choose one MVC finding the tool describes as mechanical. Explain a plausible
behavior difference in routing, model binding, anti-forgery, error handling, or
request lifetime. Add it to the worksheet and ask the agent to revise the
assessment. Preserve the original and revised diff.

If the agent omits tests from scope, reject the scope and restart assessment
with the full solution.

## 7. Transfer

Find a package in another application. Decide whether it should be kept,
upgraded, replaced, framework-provided, deferred, or removed, and cite target
framework and behavior evidence.

## 8. Knowledge check and reflection

1. Can a source incompatibility stop a build? Why?
2. Why can an informational behavioral finding outrank a compile error?
3. What evidence is missing from API counts?
4. Which assessment statement did you revise, and what proof changed it?

**Learner artifacts:** Completed assessment worksheet and prioritized risk
register.

Continue to [Chapter 02: Customization and planning](../02-planning/README.md).

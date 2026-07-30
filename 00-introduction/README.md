# Chapter 00: Orientation, preflight, and baseline behavior

## Outcomes

By the end, you can:

- explain assessment, planning, and execution as separate review stages;
- verify the supported environment before the agent changes anything;
- distinguish compatibility category from severity and business priority;
- predict and inspect a small assessment;
- record baseline behavior as evidence.

## State contract

- **Start:** Fresh clone; no generated upgrade state.
- **End:** A reviewed SimpleLegacyApp `assessment.md` and your baseline notes.
- **Known-good end:** `checkpoints/00-orientation`.
- **Verify:** The app still builds/runs and assessment evidence traces to source.
- **Reset/resume:** `.\scripts\Reset-Course.ps1 -Checkpoint 00-orientation`.
- **If output differs:** Follow [the comparison guide](../docs/OUTPUT-DIFFERS.md);
  do not chase exact wording or counts.

## 1. Explain: what the agent does

GitHub Copilot modernization assesses the solution, records confirmed strategy
choices, creates a plan and tasks, then executes tasks with validation. State is
stored under `.github/upgrades/`; commit it with your branch.

The agent accelerates discovery and changes. It does not own business priority,
behavioral equivalence, data safety, command approval, or production readiness.

Supported .NET Framework releases remain serviced Windows components. Teams
modernize to gain modern .NET capabilities, performance, hosting, libraries,
and lifecycle choices—not because supported security fixes have disappeared.

Read the [technical interpretation guide](../docs/TECHNICAL-GUIDANCE.md).

## 2. Predict: identify likely evidence

Inspect `code/Program.cs`, `code/Serialization.cs`, and `code/App.config`.
Before running the agent, write:

| Signal | Predicted category | Business/runtime concern | Validation needed |
|---|---|---|---|
| `ConfigurationManager` |  |  |  |
| `HttpContext.Current` |  |  |  |
| `BinaryFormatter` |  |  |  |

Compatibility category does not determine priority. A single unsafe
serialization path can outrank many compile errors.

## 3. Perform: preflight and baseline

Run:

```powershell
.\scripts\Test-Prerequisites.ps1
Set-Location .\00-introduction\code
nuget restore .\SimpleLegacyApp.sln
msbuild .\SimpleLegacyApp.sln /p:Configuration=Release
.\SimpleLegacyApp\bin\Release\SimpleLegacyApp.exe
```

Record the exit code and observable output. Do not use customer or production
data.

In Visual Studio:

1. Open `SimpleLegacyApp.sln`.
2. Verify a trusted repository and signed-in Copilot account.
3. Right-click the project and select **Modernize**, or send `@Modernize`.
4. Request an upgrade to stable .NET 10 in **Guided** mode.
5. Use the already-created dedicated branch; do not skip source control.
6. Review every requested file access and command before approval.
7. Stop when `assessment.md` is produced. Do not plan or execute in this chapter.

## 4. Inspect: read evidence, not colors

For each finding, record:

1. compatibility category;
2. tool severity;
3. business criticality;
4. runtime exposure;
5. remediation confidence;
6. required validation.

A source incompatibility can block compilation. A behavioral change can be
critical despite an informational label. Compare your artifact with
`../checkpoints/00-orientation/artifacts/assessment.md`.

## 5. Validate independently

- Re-run the release build and application.
- Confirm the agent made no source edits during assessment.
- Trace every sampled finding to a source line.
- Search for one likely false negative, such as another serialization call.
- Run `git diff` and inspect generated Markdown before committing it.

## 6. Troubleshoot a variation

Ask the agent to explain why `BinaryFormatter` has greater security and persisted
data implications than a namespace replacement. Reject any answer that reduces
the decision to analyzer color. Add your conclusion to `assessment.md`, then ask
the agent to revise its summary.

## 7. Transfer

Choose one API in an application you know. Describe the six interpretation
dimensions and one test that would prove the intended behavior after a port.

## 8. Knowledge check and reflection

1. Why can a source incompatibility be a blocker?
2. Why is finding count not an effort estimate?
3. Which evidence must come from tests rather than an analyzer?
4. What command or file access would you reject, and why?

**Learner artifact:** Save the prediction table, baseline output, one corrected
assessment assumption, and your reflection.

Continue to [Chapter 01: Assessment](../01-assessment/README.md).

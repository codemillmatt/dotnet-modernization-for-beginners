# Optional introductory assessment sample

`SimpleLegacyApp` is a small SDK-style .NET Framework 4.8 console project.
It isn't the BookCatalog web project used in the required course.

| File | What to inspect |
| --- | --- |
| `SimpleLegacyApp/Program.cs` | `HttpContext.Current` and legacy configuration |
| `SimpleLegacyApp/Serialization.cs` | `BinaryFormatter` serialization and deserialization |
| `SimpleLegacyApp/App.config` | XML application settings |

These APIs give the agent examples to assess.
Read the explanation for each finding. The API name alone doesn't tell you its priority.

Open `02-introduction\code\SimpleLegacyApp.sln` from the repository root in Visual Studio on Windows.
In Copilot Chat, send:

```text
@Modernize Assess SimpleLegacyApp for .NET 10.
Create a scenario for this console solution, separate from any BookCatalog scenario.
Do not change application code or create Git commits.
Stop after the assessment and show its path.
```

Check that the report identifies this console solution and explains its API findings.
The [previous BookCatalog sample run](../../examples/assessments/bookcatalog/README.md) shows output for a different application, not expected results for this console sample.
Return to `shared-legacy-app\BookCatalog.sln` before continuing the required course.

The deliberately legacy serialization code is for local sample data only. Do not deserialize an untrusted payload.

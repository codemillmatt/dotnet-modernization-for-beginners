# Optional introductory assessment sample

`SimpleLegacyApp` is a small SDK-style .NET Framework 4.8 console project. It is separate from the classic BookCatalog web project used in the main workshop.

| File | What to inspect |
| --- | --- |
| `SimpleLegacyApp/Program.cs` | `HttpContext.Current` and legacy configuration |
| `SimpleLegacyApp/Serialization.cs` | `BinaryFormatter` serialization and deserialization |
| `SimpleLegacyApp/App.config` | XML application settings |

These uses help you practice reading a compatibility report. Do not assign blocker/warning/informational priority solely from the API name or expect a fixed report category.

Use a separate clone for this warm-up so its scenario state cannot be mistaken for the BookCatalog assessment. Open `SimpleLegacyApp.sln` in Visual Studio on Windows, select **Modernize**, and follow [the optional assessment exercise](../README.md#optional-your-first-assessment). Stop after the report.

The deliberately legacy serialization code is for local sample data only. Do not deserialize an untrusted payload.

# SimpleLegacyApp: Chapter 00 evidence sample

This .NET Framework 4.8 console app deliberately contains three different
modernization signals:

| File | Signal | Why it matters |
|---|---|---|
| `Program.cs` | `ConfigurationManager` and `HttpContext.Current` | Configuration and request lifetime change |
| `Serialization.cs` | `BinaryFormatter` | Removed, insecure serialization design |
| `App.config` | Legacy configuration | Must map deliberately to modern providers |

Open `SimpleLegacyApp.sln`, build, and run it before assessment. Record the
observable output without entering production data.

The sample is intentionally unsafe legacy code. Do not copy its serialization
approach into another application.

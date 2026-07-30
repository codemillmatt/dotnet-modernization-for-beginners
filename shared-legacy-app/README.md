# Shared legacy baseline

This immutable source is the starting state for Chapters 01–03.

## Projects

- `BookCatalog.Core`: .NET Framework 4.8 model dependency.
- `BookCatalog.Web`: ASP.NET MVC 5, EF6, `System.Web`, and LocalDB.
- `BookCatalog.CharacterizationTests`: nine Windows/LocalDB behavior tests.

The tests cover CRUD, validation, routing, response behavior, initialization and
seed data, configuration, anti-forgery metadata, errors, and the active-book EF
query. Run them before asking the agent to change code:

```powershell
nuget restore .\BookCatalog.sln
msbuild .\BookCatalog.sln /p:Configuration=Release
dotnet test .\tests\BookCatalog.CharacterizationTests\BookCatalog.CharacterizationTests.csproj --configuration Release
```

Requirements: supported Visual Studio, .NET Framework 4.8 Developer Pack, ASP.NET
and web development tools, IIS Express, and SQL Server Express LocalDB.

`Web.config` enables debug output and detailed errors only to expose legacy
signals in a local learning application. Never deploy it unchanged.

Do not edit this folder directly. Use
`scripts/Reset-Course.ps1 -Checkpoint legacy-baseline` and work under ignored
`work/`.

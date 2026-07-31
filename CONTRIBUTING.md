---
title: Contributing
nav_order: 30
permalink: /contributing/
---

# Contributing

Keep learner instructions reproducible, evidence-based, accessible, and free of
identities or live cloud values.

Before opening a change:

```powershell
.\scripts\Test-CourseContent.ps1
dotnet build .\checkpoints\03-modernized\BookCatalog.slnx --configuration Release
dotnet test .\checkpoints\03-modernized\BookCatalog.slnx --configuration Release --no-build
az bicep build --file .\checkpoints\05-cloud-ready\infra\main.bicep
```

On Windows, also build and test `shared-legacy-app\BookCatalog.sln`.

Do not add UI screenshots unless visual state is necessary and durable
instructions cannot express it. If an image is required, use synthetic values,
write meaningful alternative text, and inspect every pixel for identities,
resource names, IDs, URLs, terminal history, and local paths.

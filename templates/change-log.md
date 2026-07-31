---
title: Reviewed change log
parent: Templates
nav_order: 3
permalink: /templates/change-log/
---

# Reviewed change log

One row per task the agent completed. Fill it in as each task finishes, while you still
remember what you looked at.

| Task/commit | What changed | Why | What the agent may have missed | Behavior at risk | Validation evidence | Decision |
|---|---|---|---|---|---|---|
| *Example:* Task 4, `a1b2c3d` | `packages.config` replaced with `PackageReference` in `BookCatalog.Web` | Every later task edits the project file; doing this first means nothing downstream handles both formats | Transitive versions are now resolved differently than before | Package version drift could change runtime behavior silently | `msbuild` clean, no new warnings; `dotnet list package --include-transitive` compared before and after; `/Books` loads with the same 5 seed rows | Accepted |
|  |  |  |  |  |  |  |

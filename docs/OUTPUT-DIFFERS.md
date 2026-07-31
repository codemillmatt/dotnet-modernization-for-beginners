---
title: When your output differs
parent: Reference
nav_order: 5
permalink: /reference/output-differs/
---

# If your output differs

Agent output is expected to vary with tool version, SDK, solution shape, source
history, tenant policy, and the constraints you provide.

1. Compare the **intent**, not wording or line counts.
2. Confirm the expected files exist under `.github/upgrades/`.
3. Check that every observed project, dependency, and risk has evidence.
4. Re-run the independent build and test commands for the chapter.
5. Add missing context to the artifact and ask the agent to revise it.
6. Do not force your output to match a model answer when your code differs.

| Difference | Safe action |
|---|---|
| Counts differ | Trace representative rows to source; counts alone are not effort |
| Severity differs | Record tool severity separately from compatibility category and business priority |
| Package advice differs | Verify target-framework support and whether functionality is framework-provided, replaced, deferred, or removed |
| Task order differs | Rebuild the dependency order and preserve acceptance and rollback gates |
| Agent edits too much | Reject, restore the last task checkpoint, split the task, and retry |
| Build succeeds but tests fail | Stop. Treat this as behavior drift, not a successful upgrade |
| Cloud SKU or region is unavailable | Choose a policy-compliant available option and update the architecture record |

To inspect a known-good ending without overwriting your work:

```powershell
.\scripts\Reset-Course.ps1 -Checkpoint 03-modernized
```

Compare your branch with `work/`; never copy a checkpoint blindly over your
application.

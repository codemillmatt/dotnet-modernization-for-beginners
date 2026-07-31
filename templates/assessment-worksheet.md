---
title: Assessment worksheet
parent: Templates
nav_order: 1
permalink: /templates/assessment-worksheet/
---

# Assessment interpretation worksheet

One row per finding. The point of the worksheet is the gap between columns 2, 3, and 4:
the agent knows compatibility, estimates severity, and cannot know your priority.

| Finding and evidence | Compatibility category | Tool severity | Business criticality | Runtime exposure | Remediation confidence | Required validation |
|---|---|---|---|---|---|---|
| *Example:* `HttpContext.Current.Session` in `CartController.cs` lines 22, 41, 78 | Source incompatibility | Error | High — every checkout path | Runtime, every request | Medium — pattern is clear, volume is unknown | Characterization tests for add, remove, and checkout; manual session-expiry check |
|  |  |  |  |  |  |  |

## Confidence and false-positive triage

- **Evidence sampled:** *Example: traced 6 of 23 `System.Web` findings back to source. All
  6 were real.*
- **Missing context supplied to the agent:** *Example: added a note to `assessment.md` that
  `LegacyReportController` is dead code behind a disabled flag.*
- **Suspected false positives and proof:**
- **Suspected false negatives and search performed:**
- **Questions requiring an owner:**

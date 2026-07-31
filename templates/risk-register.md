---
title: Risk register
parent: Templates
nav_order: 4
permalink: /templates/risk-register/
---

# Modernization risk register

A risk without an owner and a trigger is a worry. Fill in all nine columns or drop the row.

| ID | Risk | Impact | Likelihood | Evidence | Mitigation | Validation | Owner | Trigger |
|---|---|---|---|---|---|---|---|---|
| R-01 | *Example:* EF Core translates the catalog search query differently from EF6 and returns different results | High — search is the main entry point | Medium | EF6 evaluated part of the predicate client-side; EF Core will not | Rewrite the predicate explicitly; add a test with the known result set | Compare result sets for 10 known queries against LocalDB | Data team | Any search result count differs from baseline |
| R-02 |  |  |  |  |  |  |  |  |

# Chapter 07: Independent modernization capstone

## Outcome

Apply the complete method to an application other than BookCatalog and defend
your decisions with evidence.

## State contract

- **Start:** Completed course artifacts and an unfamiliar or learner-owned
  application approved for assessment.
- **End:** Independent transfer plan, safe executed subset, evidence, and rubric.
- **Known-good structure:** `checkpoints/07-capstone`.
- **Verify:** No rubric criterion is missing and claims cite reproducible
  evidence.
- **Reset workspace:** `.\scripts\Reset-Course.ps1 -Checkpoint 07-capstone`.
- **If output differs:** Difference is expected; the rubric evaluates reasoning
  and proof, not BookCatalog similarity.

## Capstone constraints

Choose an application with at least two of these:

- a dependent project or mixed target frameworks;
- authentication and authorization;
- configuration transforms or external secrets;
- an external service;
- a behavioral incompatibility;
- existing data;
- a reason to consider partial or side-by-side migration.

Do not use production data or credentials. Obtain owner approval and follow
organizational Copilot policy.

## Required learning loop

### 1. Explain

Describe business value, owners, current architecture, user-critical behavior,
data, security, deployment, and why modernize/rewrite/retire was selected.

### 2. Predict

Predict high-risk findings and write tests before assessment. Record likely
false negatives.

### 3. Perform

Create a clean branch, baseline commit, and generated-artifact checkpoint. Run
assessment and planning in Guided Mode. Execute only a bounded subset that has
owner approval and rollback evidence.

### 4. Inspect

Review artifacts, commands, dependencies, code, infrastructure, and data
changes. Explain representative diffs through the five review lenses.

### 5. Validate

Prove behavior, data, security, performance where relevant, deployment, and
rollback independently.

### 6. Troubleshoot

Document one reject/revise/retry/pause/rollback path and what evidence changed
the next attempt.

### 7. Transfer

Explain which BookCatalog assumptions did not transfer and how your plan
changed.

### 8. Reflect

State what remains before production, who owns it, and which evidence would
change your recommendation.

## Submission

Use `../templates/transfer-plan.md` and
`../checkpoints/07-capstone/rubric.md`. Include:

- baseline tests and behavior inventory;
- assessment worksheet and risk register;
- default-versus-custom plan comparison;
- dependency-aware tasks, acceptance, rollback, deferred work, and approvals;
- reviewed change log for any executed subset;
- schema/data and cloud decisions when applicable;
- reproducible commands and sanitized evidence.

Score each rubric row 0–3. A passing submission has no zero and at least 20/27.
Ask a reviewer to challenge one decision and update the plan based on evidence.

## Final knowledge check

Can you:

1. explain why each decision was made;
2. detect unsafe or incorrect generated output;
3. prove behavioral and data equivalence;
4. recover without discarding unrelated work;
5. describe the gap between a successful lab and a production release?

If any answer lacks evidence, the capstone is not complete.

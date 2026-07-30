# Safe human-in-the-loop workflow

The modernization agent can read files, edit code, run commands, and propose
cloud resources. Treat it like a capable contributor whose work requires review.

## Before assessment

1. Confirm repository trust and organizational Copilot policy.
2. Read your organization's privacy and data-handling rules. Do not send
   credentials, production data, customer data, or regulated information.
3. Create a dedicated branch from a reviewed baseline.
4. Require a clean working tree: `git status --short` must be empty.
5. Build and run characterization tests.
6. Commit the baseline tests and record the command output.

## At every stage boundary

1. Read generated Markdown before approving the next stage.
2. Inspect every changed file with `git diff --stat` and `git diff`.
3. Read each proposed terminal command. Check its directory, scope, destructive
   flags, network effects, credentials, and cost before approval.
4. Run independent build and behavior validation; agent narration is not proof.
5. Commit one coherent task only after validation passes.

Commit `.github/upgrades/` with the branch. Those files are state, review
evidence, and a recovery point.

## Steering and recovery

| Situation | Response |
|---|---|
| Wrong assumption | **Reject**, state the constraint and evidence, then ask for a revised artifact |
| Task is too broad | **Revise** the plan: split the task and add separate validation gates |
| Transient command failure | Inspect the error, correct the condition, then **retry** only the failed step |
| Need more review | Say **pause** or remain in Guided Mode |
| Unsafe or unexplained command | Deny it; ask what it changes and for a non-destructive alternative |
| Failed task | Restore the task checkpoint with `git restore` or revert the task commit |
| Corrupt agent state | Preserve evidence, remove only the scenario folder, then restart from an immutable checkpoint |

Never use broad reset commands on a working tree containing uncommitted learner
work. The provided reset script only recreates ignored `work/`.

## Generated-code risks

Review for behavior drift, authorization changes, overposting, data loss,
insecure defaults, dependency vulnerabilities, secret exposure, logging of
sensitive data, and unbounded cloud cost. Generated infrastructure varies by
tool version and tenant; validate it with Bicep lint/build, `what-if`, policy,
and a human architecture review.

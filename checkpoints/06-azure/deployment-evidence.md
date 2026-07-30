# Synthetic deployment evidence template

Do not record subscription IDs, tenant IDs, object IDs, email addresses, tokens,
passwords, or full terminal history.

| Gate | Learner evidence |
|---|---|
| Bicep lint/build | Command and pass/fail |
| `what-if` review | Expected creates/updates/deletes and reviewer |
| Policy/SKU/region | Policy result and current availability |
| Migration | Migration name, reviewed SQL, deployment identity, backup/restore evidence |
| Runtime permissions | `db_datareader` and `db_datawriter`; no DDL role |
| Deployment | Artifact digest and deployment result |
| Behavior | Index, anti-forgery, CRUD/persistence, health result |
| Observability | Trace or log correlation evidence without PII |
| Rollback | Rehearsed application and schema response |
| Cleanup | Resource group absence and cost review |

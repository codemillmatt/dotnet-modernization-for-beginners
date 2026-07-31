# Model prioritized risk register

| ID | Risk | Impact | Likelihood | Mitigation | Gate |
|---|---|---|---|---|---|
| R-01 | Schema initialization destroys or diverges existing data | Critical | Medium | Checked-in EF migration, backup/restore rehearsal, separate deployment identity | Stop before deploy if migration SQL or restore is unreviewed |
| R-02 | MVC binding or anti-forgery behavior changes | High | Medium | Explicit bind allowlists; manual check of every write and error path, or characterization tests if you wrote them | Stop if a write or error path behaves differently |
| R-03 | EF query result/order differs | High | Medium | Compare the same seeded queries before and after against LocalDB, not an in-memory provider | Stop if result set or ordering differs |
| R-04 | Configuration resolves wrong environment | High | Medium | Configuration tests and deployment-time Key Vault reference | Stop if a secret enters source or logs |

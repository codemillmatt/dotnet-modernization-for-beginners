# Model prioritized risk register

| ID | Risk | Impact | Likelihood | Mitigation | Gate |
|---|---|---|---|---|---|
| R-01 | Schema initialization destroys or diverges existing data | Critical | Medium | Checked-in EF migration, backup/restore rehearsal, separate deployment identity | Stop before deploy if migration SQL or restore is unreviewed |
| R-02 | MVC binding or anti-forgery behavior changes | High | Medium | HTTP characterization tests and explicit bind allowlists | Stop if write/error-path tests fail |
| R-03 | EF query result/order differs | High | Medium | Run equivalent seeded query tests and production-like provider tests | Stop if result set or ordering differs |
| R-04 | Configuration resolves wrong environment | High | Medium | Configuration tests and deployment-time Key Vault reference | Stop if a secret enters source or logs |

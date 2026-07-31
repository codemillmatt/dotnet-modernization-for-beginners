# Default versus customized plan

| Concern | Plausible default | Reviewed customization | Why safer |
|---|---|---|---|
| Scope | Web project only | Include dependency and tests | Preserves dependency and evidence |
| EF | Port with web framework | Separate post-web gate | Isolates behavior and data failures |
| Tasks | Broad framework task | Split structure, web, and data | Smaller diffs and rollback points |
| Validation | Build and manual page | Nine behavior tests at every gate | Proves observable contract |
| Cloud schema | Runtime initialization | Deployment identity applies migration | Least privilege and reviewable schema |

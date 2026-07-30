# Model cloud architecture decision

- **Decision:** App Service, system-assigned identity, Azure SQL, Key Vault
  references, workspace-based Application Insights, and Bicep.
- **Why:** Lowest conceptual overhead for this stateful MVC learning lab.
- **Data:** A separate Microsoft Entra deployment identity applies checked-in EF
  migrations; runtime receives reader/writer only.
- **Lab compromises:** Public endpoints, one region, economical SKUs, local
  operator deployment.
- **Production gaps:** Private networking, availability target, backups and
  restore tests, deployment slots, CI/CD federation, alerts/runbooks, capacity,
  data-migration rehearsal, governance approval.
- **Alternatives:** Container Apps for container/revision requirements;
  user-assigned identity for reuse/pre-authorization; enterprise IaC when
  mandated by the platform team.

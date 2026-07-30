# Checkpoint 05: Cloud-ready overlay

This overlay combines with `checkpoints/03-modernized` to create the known-good
cloud-ready state. It contains reviewed Bicep, database permission scripts,
deployment automation, behavior validation, and cleanup.

The runtime uses managed identity. The secure SQL administrator password is
still required to bootstrap the Azure SQL logical server, but it is supplied at
deployment time and is never used by the app. The runtime identity receives
only `db_datareader` and `db_datawriter`; a separate Microsoft Entra deployment
identity applies EF Core migrations.

The template intentionally uses public service endpoints and an economical SKU
for a learning lab. Before production, decide on private networking, zone and
region redundancy, backups, restore tests, deployment slots, autoscale, alerting,
retention, and an enterprise CI/CD identity.

Use `scripts/Reset-Course.ps1 -Checkpoint 05-cloud-ready` from the repository
root to assemble the modernized source and this overlay under `work/`.

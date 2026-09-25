# BookCatalog execution excerpts

These selections come from `final-mod-agent-files` in the supplied notes.
That folder name doesn't establish a finished upgrade.
Each fenced block is verbatim. No private paths or credentials have been substituted into quoted text.
Instead, selections omit lines that contain private environment details.

## A successful build isn't runtime acceptance

Source: `tasks\03.04-code-verification\solution-build-retry.log`, final summary.

```text
Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:04.33
```

The earlier build log records 18 warnings and two errors, including `MSB3027` and `MSB3021`.
The task narrative attributes these to a running migration process locking its executable.
The retry above supplies the later successful build evidence.
It doesn't show a Visual Studio F5 launch or a saved edit.

## HTTP probes reached the host, not the book workflow

Source: `tasks\02.02-proxy-host\http-results.log`, complete file.

```text
legacy-css HTTP 200
core-health HTTP 200
proxy-css HTTP 200
Stylesheet SHA256 B6CA11E949078B15B555C50DDBA24B525B553C7224C44417B19CA6E8A1F36645; direct/proxy bytes identical
Core and proxy fingerprint headers absent
database-route-blocked HTTP 503
forged-host HTTP 400
https-redirect HTTP 307
PASS: database-independent HTTP checks only; no CRUD, database admission, or certificate-trust validation.
```

Later probes also served native CSS with the legacy host stopped.
They still returned HTTP 503 for book routes.
The script used a loopback certificate-trust bypass, so these results don't validate certificate trust.

## A fresh fixture passed admission

Source: `tasks\02.01-database-safety\disposable-admission.log`, one result line.

```text
PASS: isolated fresh fixture backup/restore, CHECKDB and DML-only runtime verified. Original LocalDB untouched.
```

The source log contains restore, physical-column, and runtime-permission results.
The accompanying task record describes three synthetic records in a new Docker SQL fixture.
This supports the reported fixture admission, not original-record preservation or completed application acceptance.
The assertion about the original LocalDB comes from the supplied record. We didn't inspect that database.

## Final validation was still open

Source: `tasks.md`, progress and status lines.

```text
**Progress**: 10/11 tasks complete <progress value="91" max="100"></progress> 91%
**Status**: In Progress - Task 04-validate-bookcatalog-migration
```

Source: `runtime-acceptance.md`, title.

```text
# Deferred runtime acceptance — not yet passed
```

Source: `runtime-acceptance.md`, **HTTP/data comparison (04)**.

```text
- Compare authorization baseline (anonymous only), static CSS and generated links. Browser visual interaction remains an explicit coverage limit unless actually exercised.
```

The supplied final task folder contains `parity-checks.ps1`, `persistence-check.ps1`, and `final-build.ps1`.
It doesn't include their final parity, restart-persistence, or final-build results.
A script records an intended check, not proof that it ran.
Some task narratives retain earlier blocked states even after fixture admission passed.
Read the superseding entries alongside the task state, rather than treating every status paragraph as current.

No generated-app Visual Studio launch, completed upgrade, or Azure workflow is established by this snapshot.
All tests were explicitly excluded from that run.

**[Recording and provenance](README.md)** · **[Maintainer evidence](../../../docs/validation.md)**

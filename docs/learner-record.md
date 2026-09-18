# Your BookCatalog learner record

Copy this template into your own local notes. Use the same copy from Chapter 00 through Chapter 04.

Use **Pass**, **Fail**, or **Not run**, with actual observations and a short reason.

Use sample data only. Keep credentials, tokens, database files, and local snapshots out of Git and chat.

## Baseline

- Date, branch, and baseline commit:
- Visual Studio version and selected .NET SDK:
- Legacy local URL:
- Upgrade scenario and assessment path:
- Unresolved setup or behavior results:

### Records to preserve

Keep these two records unchanged. Use a different, throwaway record for edits, validation experiments, and deletion.

| Field | Active carry-forward record | Inactive carry-forward record |
| --- | --- | --- |
| Actual ID | | |
| Details URL | | |
| Title | | |
| Author | | |
| ISBN, including SQL `NULL` | | |
| PublishedYear, including SQL `NULL` | | |
| IsActive | `true` | `false` |
| Stored CreatedDate from Chapter 02 export | | |

Use the export for timestamp precision, not the date-only details page. Keep `NULL` distinct from an empty string.

### Behavior checks

Use these cases on the legacy app and your upgraded app. The cloud column is optional.

| Check and acceptable result | Legacy | Upgraded | Optional Azure |
| --- | --- | --- | --- |
| Main list includes active books in title order. Inactive carry-forward record stays absent | | | |
| Both carry-forward details URLs show the expected records | | | |
| New throwaway record remains after application restart | | | |
| Empty title/author, title over 200 characters, and year outside 1800–2100 are rejected | | | |
| Throwaway edits persist without changing its stored CreatedDate | | | |
| Inactive throwaway record leaves the list, but its details route works | | | |
| Restoring throwaway active status puts it back in title order | | | |
| An unused ID returns HTTP 404, not an empty success page | | | |
| Deleting the throwaway record makes its details route return 404 | | | |
| A write without a valid antiforgery token is rejected | | | |

Seed counts apply only before additions. Use `/Books/Details/2147483647` for a missing ID only after confirming it is unused.

See [Chapter 00's check guidance](../00-introduction/README.md#check-behavior-with-a-separate-record) for server validation, antiforgery, and stored creation time.

## Assessment decisions

| Finding and source location | Compatibility category | User impact | Fix, replace, remove, or defer | Check |
| --- | --- | --- | --- | --- |
| | | | | |

- Assessment section I edited:
- Baseline context I attached:
- What the agent changed after reconciliation:
- Any disputed or unverified finding:

## Requirements and upgrade plan

Use the requirement IDs from Chapter 01. Point to actual plan sections, not only chat replies.

| Requirement | Plan action or task specification | Check and result location |
| --- | --- | --- |
| R1: Keep selected IDs | | |
| R2: Keep field values, nulls, active state, and stored CreatedDate | | |
| R3: Preserve filtering and title order | | |
| R4: Leave legacy database unchanged | | |
| R5: Copy into the separate target | | |
| R6: Preserve request and persistence behavior | | |

- EF Core choice and reason:
- When I would choose EF6 instead:
- Weak plan step I changed and why:
- Agent's response to the edit:
- Reviewed plan path and checkpoint:

## Selected-record comparison

- Source export path: `.bookcatalog-lab\books.json`
- Selected IDs checked against the export:
- Null fields and stored timestamps inspected:
- Import preview destination and result:
- Apply result:
- Verify result:
- Source unchanged check and result:
- Any difference and its resolution:

Similar titles do not prove preservation. Compare the same IDs and all fields.

## Upgrade review and recovery

- Representative diff I checked:
- Behavior results and unresolved failures:
- Last reviewed commit and last successful command:
- Existing scenario and next pending group after reopening:
- Independent author-filter change and its checks:

## Azure assessment and plan

- Actual assessment/configuration and migration-plan paths:
- Target-specific finding, source, and proposed action:
- Hosting target chosen and alternative considered:
- Plan section I edited:
- What the agent changed after reconciliation:
- LocalDB replacement and selected-record copy:
- Configuration and runtime identity responsibilities:
- Developer/administrator responsibilities:
- Access, region, cost, and public-access assumptions:
- Deployment checks, diagnostics, recovery, and cleanup owner:
- Unresolved questions before any deployment:

Required course completion means a reviewed Azure plan. It does not require a subscription or deployed resources.

## Optional deployment evidence

Leave this section **Not run** if you stop after planning.

- Approved subscription, scope, region, budget, and owner:
- Reviewed outputs file and dedicated resource group:
- Schema preparation result:
- Cloud import preview, apply, and exact-value verification:
- Cloud behavior and restart results:
- Temporary firewall-rule cleanup result:
- Dedicated resource-group deletion result:

## What I can explain

- A requirement that changed the plan:
- A build success that needed a separate behavior or data check:
- A decision I would change for a larger application:
- My next safe action if a check fails:

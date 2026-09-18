# Writing guide

Write short, direct English without changing technical meaning. Teach the next decision and action, not the entire architecture at once.

## Teaching pattern

Each lesson needs a clear starting state, a useful change or decision, and observable exit evidence.

Explain the concept before the action that needs it. Keep its purpose, instructions, and expected result close together.

Use **what, why, and how** as a reasoning check, not mandatory headings.

For an agent activity, connect the learner's requirement to an artifact edit and a later check. A copied prompt alone does not demonstrate understanding.

Give learners a chance to decide, predict, inspect, or attempt a change before showing worked reasoning.

Keep the continuing BookCatalog project. Distinguish supplied helpers from learner application code and from product features.

Preserve standalone sample quickstarts. Do not make reference users complete the course merely to run an example.

## Rules for authors

1. State one instruction per sentence.
2. Name the actor in procedures.
3. Aim for at most 20 words per instruction where precision permits.
4. Keep descriptions within 25 words where practical.
5. Use one topic per paragraph.
6. Replace prose semicolons with separate sentences.
7. Use the same term for the same concept.
8. Preserve uncertainty, conditions, warnings, and scope limits.

Keep commands, identifiers, product names, and quoted output exact. Do not remove a safety condition to shorten a sentence.

Use strict structural rules for procedures and errors. Use approachable technical prose for explanations.

Do not claim that a rewrite proves technical accuracy or official ASD-STE100 compliance.

## Terms used in this course

| Term | Meaning |
| --- | --- |
| Assessment | Findings and context about the current application |
| Requirement | A learner-owned condition the result must satisfy |
| Plan | Chosen actions, dependencies, order, and acceptance checks |
| Task specification | Instructions and acceptance conditions for a unit of planned work |
| Progress | Agent-updated execution state, which still needs evidence |
| Runnable group | Coupled changes with a stated runnable boundary |
| Checkpoint | Reviewed Git commit with its recorded checks |
| Compatibility | Whether source, binaries, or behavior work with a change |
| Business priority | Importance of the affected behavior to its users |
| Carry-forward record | One of the two stable learner-created records preserved across environments |
| Throwaway record | A separate record used for edits and destructive checks |
| Snapshot | Versioned export of selected source records and their stored values |
| Preview | Nonmutating inspection of the proposed selected-record copy |
| Apply | Explicit transactional selected-record import |
| Verify | Comparison of stored target values with the source snapshot |
| Managed identity | Azure identity the running application uses for supported service access |
| Core completion | Learner-confirmed outcomes for Chapters 00 through 04, including Azure planning |

Do not use seed, copy, and schema migration as synonyms.

Framework upgrade uses GitHub Copilot upgrade. Azure migration uses GitHub Copilot modernization. Both start through Visual Studio's Modernize experience.

Document actual artifact paths and purposes. Do not assume Azure and framework-upgrade state share a schema.

## Executable content

State the shell, directory, file, action, and expected result. This learner path uses Windows, Visual Studio 2026, and PowerShell.

Use Windows paths in commands. Keep URL and Markdown link syntax valid.

Add native-command error checks when later steps depend on success. Distinguish an external command's exit code from a PowerShell cmdlet error.

Mark every placeholder and explain its replacement. Do not assume selected record IDs, issue counts, package patches, or promised failures.

Name a code fragment's insertion point. Say whether it is an example, focused edit, or complete replacement.

Never hide approval, cost, data, or destructive-action warnings inside optional explanation.

## Evidence and continuity

Keep learner notes in the [learner record](learner-record.md). Keep commands for maintainers and actual execution records in [validation](validation.md).

Keep deeper demonstrations and review criteria in the optional [instructor companion](instructor-guide.md). Do not require instructor reading or a presentation.

Separate planned checks, source inspection, local execution, rendered-page review, live Azure results, and observed learner understanding.

A reference test does not validate a different learner-generated application. A date-only screenshot does not prove stored timestamp preservation.

Preserve public chapter routes and existing deep links. Add aliases when moving sections to an optional reference.

Changing an exercise can invalidate an old completion mark. Update its completion criteria without erasing a learner's theme or valid resume destination.

The course keeps six visual eras and five required chapters. Optional paid deployment is a reference, not a sixth required chapter.

## Language checks

The project uses [ASD-STE100-inspired guidance](https://github.com/danyuchn/asd-ste100-skill). The included linter checks structural patterns, not the official ASD dictionary.

The vendor copy comes from commit `7d4a135a199a5d7447c4886bcd7ffe742a627bc9`. Its MIT license remains in `tools\vendor\STE-LICENSE`.

The wrapper excludes code, historical records, and third-party notices. It treats table cells separately.

From the repository root, use `npm run test:language`. On Windows, a direct check is:

```powershell
py -3 -B tools\check-language.py
if ($LASTEXITCODE -ne 0) { throw "Review the language findings." }
```

Review each finding in context. For example, deleting a database and removing a package are different operations.

Passing a structural check does not establish teaching quality. Reread the complete learner sequence after edits.

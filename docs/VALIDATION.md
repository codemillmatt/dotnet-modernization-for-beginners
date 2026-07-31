---
title: Proving behavior didn't change
parent: Reference
nav_order: 3
permalink: /reference/validation/
---

# Proving behavior didn't change

A green build means it compiles. Green tests mean the things you tested still work. Neither
means the application behaves the way it did before.

This page is what to check beyond the build — and what to do when there's no test run to
go beyond.

## Start here: you probably have no tests

Most legacy codebases don't have them. BookCatalog, the app this course uses, has none —
deliberately, because that's the realistic case.

This has a specific consequence that's easy to miss. The agent's per-task validation loop
**builds, then runs whatever tests it can discover**. Discover zero tests and the loop
still reports success. Nothing lies to you; the loop simply has one fewer signal, and
"task complete" quietly comes to mean "it compiles."

So on an untested codebase you have exactly two options, and you should pick on purpose:

| Option | Cost | What it buys you |
|---|---|---|
| Validate manually | Free to start, expensive every time you repeat it | Enough for a small app you can click through in ten minutes |
| Write characterization tests first | Hours up front | The agent self-heals against your behavior, not just the compiler |

For a single-controller app, manual is defensible. Past that it stops scaling, and the
second option is the professional answer.

## Characterization tests come first

A characterization test records what the application does *today*, correct or not. It isn't
a specification — it's a snapshot you can compare against. If the legacy app sorts badly,
your test asserts the bad sort. You are pinning behavior, not endorsing it.

The agent runs whatever tests you already have. **It does not write them for you.** Nothing
in the modernization tooling generates a test suite. If a part of your app has no tests and
you're about to change it, write them before you start. That's the whole safety net.

Write them against observable behavior, not internals:

- HTTP status codes and redirects for each route
- The shape of what a controller action returns
- Validation errors for known-bad input
- Query results for known data
- Anything with money or dates in it

### Writing them for a .NET Framework web app

The awkward part is that you're testing the *old* app, so the test project targets
.NET Framework too, and the modern in-process host builders aren't available.

Three approaches, cheapest first:

1. **Test the model and the data layer directly.** Instantiate your `DbContext` against
   LocalDB, run the same queries the controllers run, assert on the results. No web host
   needed. This catches EF6 → EF Core translation differences, which are the changes most
   likely to hurt you.
2. **Test controllers as plain classes.** An MVC 5 controller action is a method returning
   `ActionResult`. Call it, cast the result, assert on the model and the view name. You
   miss the pipeline — routing, filters, model binding — but you cover the logic.
3. **Test over HTTP.** Start IIS Express, drive it with `HttpClient`, assert on status
   codes and response bodies. Slowest and most brittle, and the only one that covers
   routing, anti-forgery, and error pages — the exact areas
   [that change silently](#what-changes-behavior-in-an-aspnet-mvc-5-to-aspnet-core-move).

Do 1 and 2 for everything, and 3 for the handful of routes you'd be fired for breaking.

Your tests will need rewriting after the upgrade, and that's fine. Approach 1 mostly
survives. Approach 3 survives almost entirely. Approach 2 needs the most rework, because
that's where the framework API surface actually changed. A test you throw away after it
caught one real regression has paid for itself.
{: .note }

### A worked solution

`checkpoints/04-validated/tests/` holds ten tests against the **modernized** BookCatalog:
seed data, route output and ordering, full CRUD round-trip, invalid-model rejection, the
validation contract on the model itself, 404 behavior, anti-forgery enforcement,
configuration binding, and a health check.

That's the target. Write your own first, then read those and notice what you didn't think
to pin down — the failure paths and the anti-forgery behavior are the ones people miss.

## Even green tests are not sufficient

Three categories of change routinely pass every test and still break production.

### In-memory providers hide SQL translation differences

Tests using an in-memory database provider never execute SQL. EF Core translates LINQ
differently from EF6, and some expressions that ran fine as client-side evaluation in EF6
either translate differently or throw.

Run at least one pass against a real database engine. LocalDB is enough for this course.

### Generated migration SQL is not reviewed by anyone unless you review it

```powershell
dotnet ef migrations script
```

Read the output before it ever touches data you care about. You're looking for dropped
columns, changed types, changed nullability, and anything that reorders or rebuilds a
table.

EF6 migration history does not port to EF Core. You establish a new baseline migration, and
whether that baseline matches your existing schema is something you verify, not assume.
{: .warning }

### Data doesn't reconcile itself

After any data-layer change:

- Row counts per table, before and after
- A handful of known records, field by field
- One aggregate that a human would notice being wrong — a report total, a sum, a count by
  category

An HTTP 200 is not data validation.

## What changes behavior in an ASP.NET MVC 5 to ASP.NET Core move

These compile cleanly and behave differently. Test each one you rely on.

| Area | What differs |
|---|---|
| Routing | Convention and attribute routing rules, route value handling, ordering |
| Model binding | Which sources bind, how collections and complex types bind, culture handling |
| Filters | Order of execution, dependency injection, async signatures |
| Anti-forgery | Token generation and validation defaults |
| Configuration | `Web.config` transforms are gone; the options pattern replaces `ConfigurationManager` |
| Session | Not enabled by default, different serialization, different eviction |
| Error handling | Different pipeline, different default pages, different status code behavior |
| Request lifetime | Scoped services and `HttpContext` availability differ |
| Static files | Must be explicitly enabled and served |

## A validation pass that's worth the time

1. **Build clean.** Warnings you didn't have before are findings.
2. **Run every test you have.** All of them, not the ones you think are relevant. If you
   have none, say so out loud rather than skipping the line — the absence is the finding.
3. **Run against a real database** at least once.
4. **Read the migration SQL.**
5. **Reconcile data.** Counts, records, one aggregate.
6. **Click through the app.** Every route a user actually uses.
7. **Check the failure paths.** Bad input, missing record, unauthorized access. These are
   where framework defaults changed and nobody notices until a customer does.
8. **Compare logs.** Same operations, same log lines? Missing logging is a real regression.
9. **Write down what you didn't check.** Deferred risk that's written down is manageable.
   Deferred risk you forgot about isn't.

Record the results in [the change log template](../templates/change-log.md) as you go.
Doing it afterward from memory produces a document nobody can rely on.
{: .tip }

## When you can't prove equivalence

Sometimes you can't. A behavior depends on a component you can't isolate, or the old
behavior was a bug you're not going to reproduce.

Say so explicitly:

- What you couldn't verify
- Why
- What would go wrong if you're wrong
- Who owns the decision to ship anyway

That's a legitimate outcome. Silence isn't.

## Where this fits in the tooling

The agent validates inside every task: it builds, runs your tests, and iterates until both
pass before moving on. That inner loop catches the mechanical failures.

What it can't catch is the thing that compiles, passes your tests, and is still wrong. That
gap is exactly the size of your test coverage — which is why the coverage conversation
happens before the upgrade, not after.

On a codebase with no tests, that gap is the entire application. The loop still runs, still
self-heals, still reports each task complete. It's just grading its own work against a
compiler. Knowing precisely what the green checkmark covers is the difference between using
this tool well and trusting it blindly.

## Related

- [Reading the assessment](TECHNICAL-GUIDANCE.md) — behavioral change versus source and
  binary incompatibility
- [Lab versus production](PRODUCTION-READINESS.md) — data migration in a real deployment
- [Official EF6 to EF Core porting guide](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)

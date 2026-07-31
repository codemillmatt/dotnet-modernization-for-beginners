---
title: Proving behavior didn't change
parent: Reference
nav_order: 3
permalink: /reference/validation/
---

# Proving behavior didn't change

A green build means it compiles. Green tests mean the things you tested still work. Neither
means the application behaves the way it did before.

This page is what to check beyond the test run.

## Characterization tests come first

A characterization test records what the application does *today*, correct or not. It isn't
a specification — it's a snapshot you can compare against.

The agent runs whatever tests you already have. **It does not write them for you.** If a
part of your app has no tests and you're about to change it, write them before you start.
That's the whole safety net.

Write them against observable behavior, not internals:

- HTTP status codes and redirects for each route
- The shape of what a controller action returns
- Validation errors for known-bad input
- Query results for known data
- Anything with money or dates in it

## Green tests are necessary, not sufficient

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
2. **Run every test.** All of them, not the ones you think are relevant.
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

## Related

- [Reading the assessment](TECHNICAL-GUIDANCE.md) — behavioral change versus source and
  binary incompatibility
- [Lab versus production](PRODUCTION-READINESS.md) — data migration in a real deployment
- [Official EF6 to EF Core porting guide](https://learn.microsoft.com/ef/efcore-and-ef6/porting/)

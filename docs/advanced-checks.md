# Optional: check requests and stored values

These checks go beyond the core course's ordinary app use. Use them when you want to inspect server validation, request protection, or stored timestamps.

You can skip them and continue with [the local upgrade](../06-upgrade-execution/README.md) or [Azure planning](../07-cloud/README.md).

Use your actual learner app. Tests of the completed reference don't automatically validate a different generated implementation.

## Check behavior with a separate record

Use your local `BookCatalogModernizedLab` demo database, or an explicitly approved Azure lab. Open the running app's address.

Create a disposable active book with valid sample values. Save its ID and `/Books/Details/<actual-id>` path before making it inactive.

Check one change at a time:

1. Edit the disposable book and confirm its saved values.
2. Restart the app and confirm those values remain.
3. Clear **Active** and save. Confirm the book leaves the list but its details route still works.
4. Restore **Active**. Confirm the book returns in title order.
5. Complete any request or timestamp checks below before deleting it.
6. Delete only that disposable record. Confirm its details route returns HTTP 404.

For a separate missing-record check, use an ID you confirmed is unused. Don't assume `/Books/Details/2147483647` is unused in every database.

Inspect the response status in browser developer tools. An error-looking page with HTTP 200 isn't a 404.

The [optional workbook](learner-record.md#behavior-checks) has a full checklist. You don't need to fill it in to continue the course.

<a id="how-to-check-the-server-and-stored-creation-time"></a>
## Check server validation

Browser validation can stop a form before the server receives it. Here, you want an actual invalid POST and an unchanged stored row.

Open the disposable record's **Edit** form. In browser developer tools, open **Network** before testing.

In **Elements**, set `novalidate` on that form. This disables native browser validation, not JavaScript validation.

For the overlong-title test, temporarily remove the title input's `maxlength` attribute. Otherwise, the browser can prevent the test input.

Test one case at a time, keeping other required fields valid:

| Input | Expected server behavior |
| --- | --- |
| Empty title | Reject the edit |
| Empty author | Reject the edit |
| Title longer than 200 characters | Reject the edit |
| Published year below 1800 or above 2100 | Reject the edit |

Leave the hidden antiforgery token unchanged for these cases. Otherwise, token rejection can hide whether field validation works.

Submit the form. Inspect **Network** for an actual POST and its response. Reload the record separately to confirm its stored values didn't change.

An on-screen warning without a POST establishes only client validation. Invalid model data can return a form with HTTP 200 and validation errors.

If JavaScript intercepts submission, use native form submission. First, confirm that the page's first form is your disposable **Edit** form.

If it isn't, replace `'form'` below with a selector for that form. Run this only in the browser console on your test app:

```javascript
HTMLFormElement.prototype.submit.call(document.querySelector('form'))
```

This bypasses submit handlers while retaining the form's fields and token.

Reload the page after each case. That restores attributes, values, and normal submission behavior.

Don't disable validation in application code to make a test reach the server.

## Check antiforgery protection

Antiforgery protection helps reject forged form submissions. It doesn't authenticate website users.

Load a fresh disposable **Edit** form with valid field values. In developer tools, remove its hidden `__RequestVerificationToken` input.

Submit and confirm that **Network** shows an actual POST. Use the native submission above if JavaScript blocks it.

Confirm the request was rejected and the stored row didn't change. ASP.NET MVC 5 and ASP.NET Core can present different error pages or status codes.

A redirect or successful write isn't a passing protection check. Investigate the actual response rather than matching an error page's appearance.

Reload the form afterward. Don't disable antiforgery protection in application code.

## Check stored creation time

The details view displays only a date. That display can't show whether an edit changed the stored time or fractional seconds.

Open SQL Server Object Explorer. Select the database the app **actually uses**, not another clone's database.

Replace `<throwaway-id>` in this read-only query:

```sql
SELECT Id, CONVERT(nvarchar(27), CreatedDate, 126) AS StoredCreatedDate
FROM dbo.Books
WHERE Id = <throwaway-id>;
```

Run it before and after a valid web edit. Compare the returned stored values. Editing a book must leave its `CreatedDate` unchanged.

The legacy and completed-reference create actions use `DateTime.Now`. This check tests edit behavior, not a requirement to preserve legacy data.

Don't reduce timestamp precision, post a replacement creation date, or change the comparison value to conceal a mismatch.

### Use these checks in Azure only after approval

Use the deployed app's URL for browser requests. Use the approved SQL administrator and `BookCatalogLab` for SQL inspection.

Follow deployment's [bounded client-access instructions](../07-cloud/deployment.md#verify-stored-values-after-restart). Keep the temporary firewall rule open only for those checks.

Don't broaden the firewall or grant schema permissions to the runtime identity to hide an access failure.

The public sample has no user authentication. Use disposable sample data, then complete [scoped cleanup](../07-cloud/deployment.md#delete-the-dedicated-lab-group).

## Interpret the result

Keep **Not run**, **Fail**, and **Pass** distinct. A successful build, a screenshot, and a stored-value comparison establish different things.

If a check fails, keep the actual request or error and inspect the relevant controller, model, or configuration. Don't overwrite your learner app with the reference.

**[Return to the local upgrade](../06-upgrade-execution/README.md)** · **[Optional workbook](learner-record.md)**

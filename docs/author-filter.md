# Optional challenge: filter books by author

Your upgraded app works. Try a small feature with less step-by-step help: let a user filter the catalog by author.

This challenge isn't required for course completion. You can go directly to [Azure planning](../04-cloud/README.md).

Start with your working .NET 10 learner app and a reviewed Git checkpoint.

## Make an independent change

Add an optional author filter to the main list. Keep active-only results and title order.

First, describe the requirement and checks in your own words.

In Visual Studio, open `shared-legacy-app\BookCatalog.sln`. Use Copilot Chat to ask the modernization agent to inspect `BooksController.Index` and `Views\Books\Index.cshtml`.

Start your request with `@Modernize`. Ask for a proposed change before authorizing edits.

Use a GET form so the filter appears in the URL. Decide what an empty filter means and how users clear it.

Check your plan before authorizing code changes. Keep unrelated redesign, schema changes, and database operations out of this feature.

## Check your result

Use your actual upgraded app and disposable target records:

- A matching author returns the expected active books in title order.
- A nonmatching author returns an empty result without an error.
- An empty or whitespace-only filter returns the full active list.
- An inactive book stays absent even when its author matches.
- Editing and viewing book details still work.

Define case-matching expectations for your database. Don't assume every provider compares text identically.

If a check fails, inspect the controller query and form field names. Keep the feature incomplete until the expected results work.

<details>
<summary>Worked approach after your attempt</summary>

Start `BooksController.Index` with the active query. Add the author condition before materializing results.

This fragment belongs inside the action. Adapt the context variable to your implementation:

```csharp
var query = db.Books.Where(book => book.IsActive);
if (!string.IsNullOrWhiteSpace(author))
{
    query = query.Where(book => book.Author.Contains(author));
}
var books = await query.OrderBy(book => book.Title).ToListAsync();
```

Add a nullable `author` parameter and a GET form in `Views\Books\Index.cshtml`. Name the input `author`.

Use EF Core's async query support in the controller. Pass the resulting books to the view using your app's existing model shape.

Keep the submitted filter visible and provide a way to clear it. Let Razor encode displayed text.

Finish the action and view together before building. Check the complete behavior rather than treating this fragment as a full replacement.

</details>

## Save or set aside the experiment

Review the diff and test the feature before saving a checkpoint.

If the experiment is incomplete, keep its changes separate from the working app you use for Azure planning.

Inspect the diff before reverting any file. Don't reset over unrelated work or replace your solution with the completed reference.

**[Next: Azure planning](../04-cloud/README.md)** · **[Return to the local upgrade](../03-upgrade-execution/README.md)**

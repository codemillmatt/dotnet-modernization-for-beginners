namespace BookCatalog.Data;

public sealed record RowDifference(int Id, string[] Fields);

public sealed record TransferPlan(BookRow[] Missing, int[] Matching, RowDifference[] Conflicting)
{
    public static TransferPlan Create(IEnumerable<BookRow> selected, IEnumerable<BookRow> existing)
    {
        var destination = existing.ToDictionary(b => b.Id);
        var missing = new List<BookRow>();
        var matching = new List<int>();
        var conflicting = new List<RowDifference>();
        foreach (var source in selected.OrderBy(b => b.Id))
        {
            if (!destination.TryGetValue(source.Id, out var target))
                missing.Add(source);
            else
            {
                var fields = Differences(source, target);
                if (fields.Length == 0) matching.Add(source.Id);
                else conflicting.Add(new(source.Id, fields));
            }
        }
        return new(missing.ToArray(), matching.ToArray(), conflicting.ToArray());
    }

    public void RequireNoConflicts()
    {
        if (Conflicting.Length > 0)
            throw new TransferException("Conflicting IDs. No rows were copied. Resolve the conflict outside this helper; never overwrite baseline data.");
    }

    public static string[] Differences(BookRow source, BookRow target)
    {
        var fields = new List<string>();
        if (source.Id != target.Id) fields.Add(nameof(BookRow.Id));
        if (!string.Equals(source.Title, target.Title, StringComparison.Ordinal)) fields.Add(nameof(BookRow.Title));
        if (!string.Equals(source.Author, target.Author, StringComparison.Ordinal)) fields.Add(nameof(BookRow.Author));
        if (!string.Equals(source.ISBN, target.ISBN, StringComparison.Ordinal)) fields.Add(nameof(BookRow.ISBN));
        if (source.PublishedYear != target.PublishedYear) fields.Add(nameof(BookRow.PublishedYear));
        if (source.IsActive != target.IsActive) fields.Add(nameof(BookRow.IsActive));
        if (source.CreatedDate.Ticks != target.CreatedDate.Ticks) fields.Add(nameof(BookRow.CreatedDate));
        return fields.ToArray();
    }
}

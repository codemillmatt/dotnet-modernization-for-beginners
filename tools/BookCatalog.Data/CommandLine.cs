using System.Globalization;

namespace BookCatalog.Data;

public sealed record CommandLine(string Operation, IReadOnlyDictionary<string, string> Values, bool Apply)
{
    public static CommandLine Parse(string[] args)
    {
        if (args.Length == 0 || args[0] is not ("export" or "import" or "verify"))
            throw new TransferException("Use export, import (preview by default), or verify. See tools\\BookCatalog.Data\\README.md.");
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        var apply = false;
        for (var i = 1; i < args.Length; i++)
        {
            var name = args[i];
            if (name == "--apply" && args[0] == "import" && !apply) { apply = true; continue; }
            var allowed = args[0] == "export"
                ? new[] { "--source-config", "--ids", "--output" }
                : ["--input", "--target-config", "--azure-outputs"];
            if (!allowed.Contains(name) || i + 1 >= args.Length
                || args[i + 1].StartsWith("--", StringComparison.Ordinal)
                || string.IsNullOrWhiteSpace(args[i + 1]) || !values.TryAdd(name, args[++i]))
                throw new TransferException("Unknown, duplicate, or missing command option. See the helper README.");
        }
        if (args[0] == "export" ? values.Count != 3
            : !values.ContainsKey("--input") || values.Count != 2
              || values.ContainsKey("--target-config") == values.ContainsKey("--azure-outputs"))
            throw new TransferException("Export requires source-config, ids and output. Import/verify requires input and exactly one target-config or azure-outputs.");
        return new(args[0], values, apply);
    }

    public static int[] ParseIds(string input)
    {
        var parts = input.Split(',');
        var ids = new List<int>();
        foreach (var part in parts)
        {
            if (!int.TryParse(part.Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out var id) || id <= 0)
                throw new TransferException("IDs must be positive integers separated by commas.");
            ids.Add(id);
        }
        if (ids.Count is < 1 or > SnapshotFile.MaximumBooks || ids.Distinct().Count() != ids.Count)
            throw new TransferException("Select 1 to 1000 distinct book IDs.");
        return ids.Order().ToArray();
    }
}

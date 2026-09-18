using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BookCatalog.Data;

public sealed class TransferException(string message) : Exception(message);

public sealed record BookRow
{
    public required int Id { get; init; }
    public required string Title { get; init; }
    public required string Author { get; init; }
    public required string? ISBN { get; init; }
    public required int? PublishedYear { get; init; }
    public required bool IsActive { get; init; }
    public required DateTime CreatedDate { get; init; }
}

public sealed record SourceIdentity
{
    public required string Server { get; init; }
    public required string Database { get; init; }
}

public sealed record TimestampStorage
{
    public required string Type { get; init; }
    public required int Scale { get; init; }
}

public sealed record BookSnapshot
{
    public required int FormatVersion { get; init; }
    public required SourceIdentity Source { get; init; }
    public required TimestampStorage CreatedDateStorage { get; init; }
    public required BookRow[] Books { get; init; }
}

public static class SnapshotFile
{
    public const int MaximumBooks = 1000;
    private static readonly System.Text.UTF8Encoding StrictUtf8 = new(false, true);
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = false,
        WriteIndented = true,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        RespectNullableAnnotations = true,
        AllowDuplicateProperties = false,
        Converters = { new StoredDateTimeConverter() }
    };

    public static BookSnapshot Parse(string json)
    {
        try
        {
            var snapshot = JsonSerializer.Deserialize<BookSnapshot>(json, Options)
                ?? throw new TransferException("The snapshot must be a JSON object.");
            Validate(snapshot);
            return snapshot;
        }
        catch (JsonException)
        {
            throw new TransferException("Invalid snapshot JSON. All version 1 fields must be present with their exact names and types.");
        }
    }

    public static async Task<BookSnapshot> ReadAsync(string path)
    {
        try
        {
            var bytes = await File.ReadAllBytesAsync(path);
            var offset = bytes.AsSpan().StartsWith(new byte[] { 0xef, 0xbb, 0xbf }) ? 3 : 0;
            return Parse(StrictUtf8.GetString(bytes, offset, bytes.Length - offset));
        }
        catch (System.Text.DecoderFallbackException)
        {
            throw new TransferException("The snapshot must contain valid UTF-8 JSON. No data was copied.");
        }
    }

    public static string Serialize(BookSnapshot snapshot)
    {
        Validate(snapshot);
        return JsonSerializer.Serialize(snapshot with { Books = snapshot.Books.OrderBy(b => b.Id).ToArray() }, Options) + "\n";
    }

    public static void Validate(BookSnapshot snapshot)
    {
        if (snapshot.FormatVersion != 1)
            throw new TransferException("Only snapshot formatVersion 1 is supported.");
        if (snapshot.Source is null || string.IsNullOrWhiteSpace(snapshot.Source.Server)
            || string.IsNullOrWhiteSpace(snapshot.Source.Database)
            || snapshot.Source.Server.Length > 128 || snapshot.Source.Database.Length > 128)
            throw new TransferException("The snapshot must identify the source server and database.");
        if (snapshot.CreatedDateStorage is not { } storage
            || !(storage.Type == "datetime" && storage.Scale == 3
                 || storage.Type == "datetime2" && storage.Scale is >= 0 and <= 7))
            throw new TransferException("Unsupported source CreatedDate storage.");
        if (snapshot.Books is null || snapshot.Books.Length is < 1 or > MaximumBooks
            || snapshot.Books.Any(b => b is null)
            || snapshot.Books.Select(b => b.Id).Distinct().Count() != snapshot.Books.Length)
            throw new TransferException("Select 1 to 1000 distinct book IDs.");
        foreach (var book in snapshot.Books)
        {
            if (book.Id <= 0 || book.Title is null || book.Title.Length > 200 || !ValidUnicode(book.Title)
                || book.Author is null || book.Author.Length > 100 || !ValidUnicode(book.Author)
                || book.ISBN?.Length > 13 || book.ISBN is not null && !ValidUnicode(book.ISBN)
                || book.CreatedDate.Kind != DateTimeKind.Unspecified)
                throw new TransferException("A book has an invalid ID, string, or timestamp.");
            if (storage.Type == "datetime")
            {
                try
                {
                    if (new System.Data.SqlTypes.SqlDateTime(book.CreatedDate).Value != book.CreatedDate)
                        throw new TransferException("CreatedDate is not an exact stored SQL datetime value.");
                }
                catch (System.Data.SqlTypes.SqlTypeException)
                {
                    throw new TransferException("CreatedDate is outside the SQL datetime range.");
                }
            }
            else if (book.CreatedDate.Ticks % (long)Math.Pow(10, 7 - storage.Scale) != 0)
                throw new TransferException("CreatedDate exceeds the declared source timestamp precision.");
        }
    }

    private static bool ValidUnicode(string value)
    {
        for (var i = 0; i < value.Length; i++)
        {
            if (!char.IsSurrogate(value[i])) continue;
            if (!char.IsHighSurrogate(value[i]) || ++i == value.Length || !char.IsLowSurrogate(value[i])) return false;
        }
        return true;
    }

    public static async Task WriteNewAsync(string path, BookSnapshot snapshot, CancellationToken cancellationToken = default)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(Serialize(snapshot));
        // CreateNew protects existing snapshots and input/configuration files from replacement.
        await using var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await stream.WriteAsync(bytes, cancellationToken);
        await stream.FlushAsync(cancellationToken);
    }

    private sealed class StoredDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.String
                || !DateTime.TryParseExact(reader.GetString(), "yyyy-MM-dd'T'HH:mm:ss.fffffff",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
                throw new JsonException("A stored timestamp requires seven fractional digits and no time zone.");
            return DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString("yyyy-MM-dd'T'HH:mm:ss.fffffff", CultureInfo.InvariantCulture));
    }
}

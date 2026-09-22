using System.Text.Json.Nodes;
using BookCatalog.Data;

namespace BookCatalog.Data.Tests;

public class SnapshotTests
{
    internal static BookRow Book(int id = 8) => new()
    {
        Id = id, Title = "  雪 & books  ", Author = "O'Brien", ISBN = null, PublishedYear = null,
        IsActive = false, CreatedDate = new DateTime(2021, 3, 4, 5, 6, 7).AddTicks(1234567)
    };

    internal static BookSnapshot Snapshot(params BookRow[] books) => new()
    {
        FormatVersion = 1,
        Source = new() { Server = "original-server", Database = "BookCatalogLegacy" },
        CreatedDateStorage = new() { Type = "datetime2", Scale = 7 },
        Books = books.Length == 0 ? [Book()] : books
    };

    [Fact]
    public void RoundtripPreservesNullsUnicodeSpacesInactiveStateAndAllTimestampDigits()
    {
        var original = Snapshot();
        var json = SnapshotFile.Serialize(original);
        Assert.Contains("2021-03-04T05:06:07.1234567", json);
        var parsed = SnapshotFile.Parse(json);
        Assert.Equal(original.Books[0], parsed.Books[0]);
        Assert.Equal(DateTimeKind.Unspecified, parsed.Books[0].CreatedDate.Kind);
        Assert.Null(parsed.Books[0].ISBN);
        Assert.Null(parsed.Books[0].PublishedYear);
    }

    [Fact]
    public void SerializationIsDeterministicAndSortsIds()
    {
        Assert.Equal(SnapshotFile.Serialize(Snapshot(Book(10), Book(8))),
            SnapshotFile.Serialize(Snapshot(Book(8), Book(10))));
    }

    [Theory]
    [InlineData("id")]
    [InlineData("title")]
    [InlineData("author")]
    [InlineData("isbn")]
    [InlineData("publishedYear")]
    [InlineData("isActive")]
    [InlineData("createdDate")]
    public void EveryBookFieldIsRequiredEvenWhenNullable(string field)
    {
        var root = JsonNode.Parse(SnapshotFile.Serialize(Snapshot()))!;
        Assert.True(root["books"]![0]!.AsObject().Remove(field));
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(root.ToJsonString()));
    }

    [Theory]
    [InlineData("formatVersion")]
    [InlineData("source")]
    [InlineData("createdDateStorage")]
    [InlineData("books")]
    public void EverySnapshotFieldIsRequired(string field)
    {
        var root = JsonNode.Parse(SnapshotFile.Serialize(Snapshot()))!.AsObject();
        root.Remove(field);
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(root.ToJsonString()));
    }

    [Theory]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("{}")]
    [InlineData("{")]
    public void RejectsMalformedShape(string json)
        => Assert.Throws<TransferException>(() => SnapshotFile.Parse(json));

    [Theory]
    [InlineData("id", "\"8\"")]
    [InlineData("id", "0")]
    [InlineData("title", "null")]
    [InlineData("author", "null")]
    [InlineData("isActive", "null")]
    [InlineData("isActive", "\"false\"")]
    [InlineData("publishedYear", "2.5")]
    [InlineData("createdDate", "\"2021-03-04T05:06:07.1234567Z\"")]
    [InlineData("createdDate", "\"2021-03-04T05:06:07.1234567+02:00\"")]
    [InlineData("createdDate", "\"2021-03-04\"")]
    public void RejectsInvalidTypesAndImplicitConversions(string field, string value)
    {
        var root = JsonNode.Parse(SnapshotFile.Serialize(Snapshot()))!;
        root["books"]![0]![field] = JsonNode.Parse(value);
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(root.ToJsonString()));
    }

    [Fact]
    public void RejectsDuplicateAndUnknownFields()
    {
        var json = SnapshotFile.Serialize(Snapshot());
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(json.Replace("\"formatVersion\": 1,", "\"formatVersion\": 1, \"formatVersion\": 1,")));
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(json.Replace("\"formatVersion\": 1,", "\"formatVersion\": 1, \"secret\": \"bad\",")));
        Assert.Throws<TransferException>(() => SnapshotFile.Parse(json.Replace("\"id\": 8,", "\"id\": 8, \"id\": 8,")));
    }

    [Fact]
    public void RejectsUnsupportedVersionsDuplicateIdsNullRowsAndExcessLengths()
    {
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot() with { FormatVersion = 2 }));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot(Book(), Book())));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot() with { Books = [null!] }));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot(Book() with { Title = new string('x', 201) })));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot(Book() with { ISBN = new string('x', 14) })));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot() with { Books = [] }));
    }

    [Fact]
    public void ChecksDeclaredTimestampStorageWithoutChangingTheTime()
    {
        var legacy = Snapshot(Book() with { CreatedDate = new DateTime(2020, 1, 1).AddMilliseconds(3) })
            with { CreatedDateStorage = new() { Type = "datetime", Scale = 3 } };
        Assert.Equal(legacy.Books[0], SnapshotFile.Parse(SnapshotFile.Serialize(legacy)).Books[0]);
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(legacy with { Books = [Book()] }));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot() with { CreatedDateStorage = new() { Type = "datetime2", Scale = 3 } }));
    }

    [Fact]
    public void InvalidUtf16IsRefusedInsteadOfSilentlyReplacingStoredCharacters()
    {
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot(Book() with { Title = "\ud800" })));
        Assert.Throws<TransferException>(() => SnapshotFile.Serialize(Snapshot(Book() with { ISBN = "\udc00" })));
        var valid = Snapshot(Book() with { Title = "Book \ud83d\udcd6" });
        Assert.Equal(valid.Books[0].Title, SnapshotFile.Parse(SnapshotFile.Serialize(valid)).Books[0].Title);
    }
}

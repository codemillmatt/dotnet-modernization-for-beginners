using BookCatalog.Data;

namespace BookCatalog.Data.Tests;

public class PlanTests
{
    [Fact]
    public void DistinguishesMissingMatchingAndConflictingWithoutChangingRows()
    {
        var wanted = new[] { SnapshotTests.Book(8), SnapshotTests.Book(9), SnapshotTests.Book(10) };
        var existing = new[] { wanted[0], wanted[1] with { Title = "different" }, SnapshotTests.Book(1) };
        var plan = TransferPlan.Create(wanted, existing);
        Assert.Equal([8], plan.Matching);
        Assert.Equal([10], plan.Missing.Select(b => b.Id));
        Assert.Equal(9, Assert.Single(plan.Conflicting).Id);
        Assert.Equal(["Title"], plan.Conflicting[0].Fields);
        Assert.Throws<TransferException>(plan.RequireNoConflicts);
        Assert.Equal("different", existing[1].Title);
        Assert.Equal("  雪 & books  ", wanted[1].Title);
    }

    [Fact]
    public void MatchingRepeatHasNothingToInsert()
    {
        var book = SnapshotTests.Book();
        var plan = TransferPlan.Create([book], [book with { }]);
        Assert.Empty(plan.Missing);
        Assert.Empty(plan.Conflicting);
        plan.RequireNoConflicts();
    }

    [Fact]
    public void ComparesOrdinalStringsNullsAndFullTimestampNotDatabaseCollationOrDate()
    {
        var source = SnapshotTests.Book();
        var target = source with
        {
            Id = 9, Title = source.Title.Trim(), Author = source.Author.ToUpperInvariant(),
            ISBN = "", PublishedYear = 0, IsActive = true, CreatedDate = source.CreatedDate.AddTicks(1)
        };
        Assert.Equal(["Id", "Title", "Author", "ISBN", "PublishedYear", "IsActive", "CreatedDate"], TransferPlan.Differences(source, target));
    }

    [Fact]
    public void ImportDefaultsToPreviewAndApplyMustBeExplicit()
    {
        var args = new[] { "import", "--input", "books.json", "--target-config", "appsettings.json" };
        Assert.False(CommandLine.Parse(args).Apply);
        Assert.True(CommandLine.Parse([.. args, "--apply"]).Apply);
        Assert.Throws<TransferException>(() => CommandLine.Parse([.. args, "--force"]));
        Assert.Throws<TransferException>(() => CommandLine.Parse([.. args, "--apply", "--apply"]));
        Assert.Throws<TransferException>(() => CommandLine.Parse([.. args, "--azure-outputs", "outputs.json"]));
        Assert.Throws<TransferException>(() => CommandLine.Parse(["verify", "--input", "b.json", "--target-config", "a.json", "--apply"]));
    }

    [Theory]
    [InlineData("")]
    [InlineData("1,1")]
    [InlineData("-1")]
    [InlineData("0")]
    [InlineData("1,")]
    [InlineData("1; DROP TABLE Books")]
    public void RejectsInvalidSelections(string ids)
        => Assert.Throws<TransferException>(() => CommandLine.ParseIds(ids));

    [Fact]
    public void OrdersExplicitSelections()
        => Assert.Equal([8, 9, 11], CommandLine.ParseIds("11,8, 9"));
}

using System.Net;
using AngleSharp.Html.Parser;
using BookCatalog.Web.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BookCatalog.Tests;

public class BehaviorTests
{
    private static Dictionary<string, string> Fields(string title = "Workshop test book") => new()
    {
        ["Title"] = title, ["Author"] = "Sample Author", ["ISBN"] = "9781234567890",
        ["PublishedYear"] = "2000", ["IsActive"] = "true"
    };

    private static async Task<HttpResponseMessage> Post(HttpClient client, string page, Dictionary<string, string> fields)
    {
        using var response = await client.GetAsync(page);
        response.EnsureSuccessStatusCode();
        var document = await new HtmlParser().ParseDocumentAsync(await response.Content.ReadAsStringAsync());
        fields["__RequestVerificationToken"] = document.QuerySelector("input[name=__RequestVerificationToken]")?.GetAttribute("value")
            ?? throw new InvalidOperationException("The form has no antiforgery token.");
        return await client.PostAsync(page, new FormUrlEncodedContent(fields));
    }

    [Fact]
    public async Task Index_filters_inactive_books_sorts_titles_and_shows_user_agent()
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("WorkshopTests/1.0");
        var html = await client.GetStringAsync("/");
        var document = await new HtmlParser().ParseDocumentAsync(html);
        var titles = document.QuerySelectorAll("tbody tr td:nth-child(2)").Select(cell => cell.TextContent.Trim()).ToArray();
        Assert.Equal(6, titles.Length);
        Assert.Equal(titles.Order(StringComparer.Ordinal).ToArray(), titles);
        Assert.DoesNotContain("The Matrix", html);
        Assert.Contains("WorkshopTests/1.0", html);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/Content/Site.css")).StatusCode);
    }

    [Theory]
    [InlineData("Title", "")]
    [InlineData("Author", "")]
    [InlineData("PublishedYear", "1799")]
    [InlineData("PublishedYear", "2101")]
    public async Task Invalid_input_does_not_create_a_record(string field, string value)
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        var fields = Fields();
        fields[field] = value;
        using var response = await Post(client, "/Books/Create", fields);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = app.Services.CreateScope();
        Assert.Equal(7, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Books.CountAsync());
    }

    [Fact]
    public async Task Long_title_is_rejected_by_server_validation()
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        using var response = await Post(client, "/Books/Create", Fields(new string('x', 201)));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("maximum length", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Writes_require_an_antiforgery_token()
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        foreach (var route in new[] { "/Books/Create", "/Books/Edit/1", "/Books/Delete/1" })
        {
            using var response = await client.PostAsync(route, new FormUrlEncodedContent(Fields()));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    [Fact]
    public async Task Crud_preserves_creation_time_and_persists_across_hosts()
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        var before = DateTime.Now.AddSeconds(-1);
        using var create = await Post(client, "/Books/Create", Fields());
        Assert.Equal(HttpStatusCode.Redirect, create.StatusCode);
        Book original;
        using (var scope = app.Services.CreateScope())
        {
            original = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Books.AsNoTracking()
                .SingleAsync(book => book.Title == "Workshop test book");
        }
        Assert.InRange(original.CreatedDate, before, DateTime.Now.AddSeconds(1));
        var editFields = Fields("Changed workshop book");
        editFields["Id"] = original.Id.ToString();
        editFields["IsActive"] = "false";
        editFields["CreatedDate"] = "1900-01-01";
        using var edit = await Post(client, $"/Books/Edit/{original.Id}", editFields);
        Assert.Equal(HttpStatusCode.Redirect, edit.StatusCode);
        Assert.DoesNotContain("Changed workshop book", await client.GetStringAsync("/"));
        Assert.Contains("Changed workshop book", await client.GetStringAsync($"/Books/Details/{original.Id}"));
        using (var nextHost = new BookCatalogFactory(app.DatabasePath))
        {
            using var nextClient = nextHost.Start();
            Assert.Contains("Changed workshop book", await nextClient.GetStringAsync($"/Books/Details/{original.Id}"));
            using var scope = nextHost.Services.CreateScope();
            var saved = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Books.FindAsync(original.Id);
            Assert.NotNull(saved);
            Assert.Equal(original.CreatedDate, saved.CreatedDate);
        }
        editFields["IsActive"] = "true";
        using var restore = await Post(client, $"/Books/Edit/{original.Id}", editFields);
        Assert.Equal(HttpStatusCode.Redirect, restore.StatusCode);
        Assert.Contains("Changed workshop book", await client.GetStringAsync("/"));
        using var delete = await Post(client, $"/Books/Delete/{original.Id}", new() { ["Id"] = original.Id.ToString() });
        Assert.Equal(HttpStatusCode.Redirect, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/Books/Details/{original.Id}")).StatusCode);
    }

    [Theory]
    [InlineData("Details")]
    [InlineData("Edit")]
    [InlineData("Delete")]
    public async Task Missing_records_return_404(string action)
    {
        using var app = new BookCatalogFactory();
        using var client = app.Start();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/Books/{action}/2147483647")).StatusCode);
    }
}

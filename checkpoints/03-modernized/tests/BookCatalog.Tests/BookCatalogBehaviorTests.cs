using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Reflection;
using BookCatalog.Core.Models;
using BookCatalog.Web.Controllers;
using BookCatalog.Web.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BookCatalog.Tests;

public sealed class BookCatalogBehaviorTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task DatabaseInitializationCreatesExpectedSeedData()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        Assert.Equal(7, await database.Books.CountAsync());
        Assert.Equal(6, await database.Books.CountAsync(book => book.IsActive));
    }

    [Fact]
    public async Task IndexRouteReturnsOnlyActiveBooksOrderedByTitle()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("Active books ordered by title", content);
        Assert.DoesNotContain("The Matrix: The Shooting Script", content);
        Assert.True(
            content.IndexOf("Clean Code", StringComparison.Ordinal) <
            content.IndexOf("Jurassic Park", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SqlServerQueryPreservesActiveOrderingWhenAvailable()
    {
        if (!OperatingSystem.IsWindows())
        {
            return;
        }

        var databaseName = $"BookCatalogModernizedTests{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer($"Server=(localdb)\\MSSQLLocalDB;Database={databaseName};Trusted_Connection=True;TrustServerCertificate=True")
            .Options;

        await using var database = new ApplicationDbContext(options);
        try
        {
            await database.Database.MigrateAsync();
            var books = await database.Books
                .Where(book => book.IsActive)
                .OrderBy(book => book.Title)
                .Select(book => book.Title)
                .ToListAsync();

            Assert.Equal(6, books.Count);
            Assert.Equal(books.OrderBy(title => title, StringComparer.CurrentCulture), books);
        }
        finally
        {
            await database.Database.EnsureDeletedAsync();
        }
    }

    [Fact]
    public async Task CrudActionsPersistChanges()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var controller = CreateController(database);

        var createResult = await controller.Create(new Book
        {
            Title = "Refactoring",
            Author = "Martin Fowler",
            ISBN = "9780134757599",
            PublishedYear = 2018,
            IsActive = true
        });
        Assert.IsType<RedirectToActionResult>(createResult);

        var created = await database.Books.SingleAsync(book => book.Title == "Refactoring");
        var editResult = await controller.Edit(created.Id, new Book
        {
            Id = created.Id,
            Title = "Refactoring, Second Edition",
            Author = created.Author,
            ISBN = created.ISBN,
            PublishedYear = created.PublishedYear,
            IsActive = created.IsActive
        });
        Assert.IsType<RedirectToActionResult>(editResult);

        var deleteResult = await controller.DeleteConfirmed(created.Id);
        Assert.IsType<RedirectToActionResult>(deleteResult);
        Assert.False(await database.Books.AnyAsync(book => book.Id == created.Id));
    }

    [Fact]
    public async Task InvalidModelDoesNotCreateBook()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var controller = CreateController(database);
        controller.ModelState.AddModelError("Title", "Title is required.");

        var result = await controller.Create(new Book { Author = "Unknown" });

        Assert.IsType<ViewResult>(result);
        Assert.False(await database.Books.AnyAsync(book => book.Author == "Unknown"));
    }

    [Fact]
    public void BookValidationContractRejectsMissingAndOutOfRangeValues()
    {
        var book = new Book { PublishedYear = 1700 };
        var results = new List<ValidationResult>();

        Assert.False(Validator.TryValidateObject(book, new ValidationContext(book), results, true));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(Book.Title)));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(Book.Author)));
        Assert.Contains(results, result => result.MemberNames.Contains(nameof(Book.PublishedYear)));
    }

    [Fact]
    public async Task MissingBookReturnsNotFound()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var response = await client.GetAsync($"/Books/Details/{int.MaxValue}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task MutatingActionsRequireAntiforgeryTokens()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var response = await client.PostAsync(
            "/Books/Create",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["Title"] = "No token",
                ["Author"] = "Unknown"
            }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var methods = typeof(BooksController).GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Where(method => method.GetCustomAttribute<HttpPostAttribute>() is not null)
            .ToList();
        Assert.NotEmpty(methods);
        Assert.All(methods, method =>
            Assert.NotNull(method.GetCustomAttribute<ValidateAntiForgeryTokenAttribute>()));
    }

    [Fact]
    public void ConnectionStringLoadsFromConfiguration()
    {
        var configuration = factory.Services.GetRequiredService<IConfiguration>();

        Assert.Contains("BookCatalogModernized", configuration.GetConnectionString("BookCatalogContext"));
    }

    [Fact]
    public async Task HealthEndpointReportsAvailability()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static BooksController CreateController(ApplicationDbContext database)
    {
        var controller = new BooksController(database)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
        controller.Request.Headers.UserAgent = "CharacterizationTests/2.0";
        return controller;
    }
}

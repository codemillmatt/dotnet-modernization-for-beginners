using BookCatalog.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BookCatalog.Web.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext database)
    {
        if (await database.Books.AnyAsync())
        {
            return;
        }

        database.Books.AddRange(BookSeedData.All.Select(book => new Book
        {
            Title = book.Title,
            Author = book.Author,
            ISBN = book.ISBN,
            PublishedYear = book.PublishedYear,
            IsActive = book.IsActive,
            CreatedDate = book.CreatedDate
        }));
        await database.SaveChangesAsync();
    }
}

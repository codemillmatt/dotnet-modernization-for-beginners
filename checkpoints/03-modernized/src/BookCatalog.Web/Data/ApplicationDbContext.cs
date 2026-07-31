using BookCatalog.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace BookCatalog.Web.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>().HasData(BookSeedData.All);
    }
}

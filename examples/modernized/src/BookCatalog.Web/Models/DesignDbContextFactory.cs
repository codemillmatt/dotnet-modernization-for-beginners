using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BookCatalog.Web.Models;

public sealed class DesignDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args) => new(
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=localhost;Database=BookCatalogModernizedLab;Integrated Security=True;TrustServerCertificate=True")
            .Options);
}

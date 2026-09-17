using BookCatalog.Web.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BookCatalog.Tests;

public sealed class BookCatalogFactory(string? databasePath = null) : WebApplicationFactory<Program>
{
    public string DatabasePath { get; } = databasePath ?? Path.Combine(Path.GetTempPath(), $"bookcatalog-{Guid.NewGuid():N}.db");
    private readonly bool ownsDatabase = databasePath is null;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite($"Data Source={DatabasePath};Pooling=False"));
        });
    }

    public HttpClient Start()
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var scope = Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.EnsureCreated();
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && ownsDatabase)
        {
            File.Delete(DatabasePath);
            File.Delete(DatabasePath + "-wal");
            File.Delete(DatabasePath + "-shm");
        }
    }
}

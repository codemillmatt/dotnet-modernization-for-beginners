using Azure.Identity;
using BookCatalog.Web.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var vaultName = builder.Configuration["KeyVaultName"];
if (!string.IsNullOrWhiteSpace(vaultName))
{
    var clientId = builder.Configuration["AZURE_CLIENT_ID"]
        ?? throw new InvalidOperationException("Set AZURE_CLIENT_ID for the cloud identity.");
    builder.Configuration.AddAzureKeyVault(
        new Uri($"https://{vaultName}.vault.azure.net/"),
        new ManagedIdentityCredential(ManagedIdentityId.FromUserAssignedClientId(clientId)));
}

var connectionString = builder.Configuration.GetConnectionString("BookCatalogContext")
    ?? throw new InvalidOperationException("Set ConnectionStrings:BookCatalogContext.");
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddControllersWithViews();

var app = builder.Build();
if (app.Configuration.GetValue<bool>("InitializeDatabase") && !app.Environment.IsEnvironment("Testing"))
{
    var database = new SqlConnectionStringBuilder(connectionString).InitialCatalog;
    if (database != "BookCatalogModernizedLab")
    {
        throw new InvalidOperationException(
            "Automatic initialization requires the BookCatalogModernizedLab database. Use a separate schema step for Azure.");
    }
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.EnsureCreatedAsync();
}

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseExceptionHandler(handler => handler.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsync("The request failed. Check the application logs.");
    }));
}
app.UseStaticFiles();
app.UseRouting();
app.MapControllerRoute("default", "{controller=Books}/{action=Index}/{id?}");
app.Run();

public partial class Program;

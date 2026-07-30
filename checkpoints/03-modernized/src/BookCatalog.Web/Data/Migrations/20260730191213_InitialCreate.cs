using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BookCatalog.Web.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Author = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ISBN = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: true),
                    PublishedYear = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Books",
                columns: new[] { "Id", "Author", "CreatedDate", "ISBN", "IsActive", "PublishedYear", "Title" },
                values: new object[,]
                {
                    { 1, "Douglas Adams", new DateTime(2001, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), "9780345391803", true, 1979, "The Hitchhiker's Guide to the Galaxy" },
                    { 2, "Gamma, Helm, Johnson, Vlissides", new DateTime(2000, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "9780201633610", true, 1994, "Design Patterns: Elements of Reusable OO Software" },
                    { 3, "David Thomas, Andrew Hunt", new DateTime(2001, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "9780135957059", true, 1999, "The Pragmatic Programmer" },
                    { 4, "Robert C. Martin", new DateTime(2008, 8, 11, 0, 0, 0, 0, DateTimeKind.Utc), "9780132350884", true, 2008, "Clean Code" },
                    { 5, "J.R.R. Tolkien", new DateTime(1999, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "9780618640157", true, 1954, "The Lord of the Rings" },
                    { 6, "Michael Crichton", new DateTime(2001, 7, 22, 0, 0, 0, 0, DateTimeKind.Utc), "9780345370778", true, 1990, "Jurassic Park" },
                    { 7, "Andy & Larry Wachowski", new DateTime(2001, 11, 6, 0, 0, 0, 0, DateTimeKind.Utc), "9781557044488", false, 2001, "The Matrix: The Shooting Script" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Books");
        }
    }
}

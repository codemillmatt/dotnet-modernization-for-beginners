using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Configuration;
using System.Data.Entity;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using BookCatalog.Core.Models;
using BookCatalog.Web;
using BookCatalog.Web.Controllers;
using BookCatalog.Web.Models;
using Xunit;

namespace BookCatalog.CharacterizationTests
{
    public sealed class BookCatalogBehaviorTests : IDisposable
    {
        public BookCatalogBehaviorTests()
        {
            Database.SetInitializer<ApplicationDbContext>(null);
            using (var db = new ApplicationDbContext())
            {
                db.Database.Delete();
                db.Database.Create();
                BookCatalogInitializer.SeedBooks(db);
            }
        }

        [Fact]
        public void DatabaseInitializationCreatesExpectedSeedData()
        {
            using (var db = new ApplicationDbContext())
            {
                Assert.Equal(7, db.Books.Count());
                Assert.Equal(6, db.Books.Count(book => book.IsActive));
            }
        }

        [Fact]
        public void IndexReturnsOnlyActiveBooksOrderedByTitle()
        {
            using (var controller = CreateController())
            {
                var result = Assert.IsType<ViewResult>(controller.Index());
                var books = Assert.IsAssignableFrom<IReadOnlyCollection<Book>>(result.Model);

                Assert.Equal(6, books.Count);
                Assert.All(books, book => Assert.True(book.IsActive));
                Assert.Equal(
                    books.Select(book => book.Title).OrderBy(title => title, StringComparer.CurrentCulture),
                    books.Select(book => book.Title));
                Assert.Equal("CharacterizationTests/1.0", result.ViewBag.UserAgent);
            }
        }

        [Fact]
        public void CrudActionsPersistChanges()
        {
            int createdId;
            using (var controller = CreateController())
            {
                var result = controller.Create(new Book
                {
                    Title = "Refactoring",
                    Author = "Martin Fowler",
                    ISBN = "9780134757599",
                    PublishedYear = 2018,
                    IsActive = true
                });
                Assert.IsType<RedirectToRouteResult>(result);
            }

            using (var db = new ApplicationDbContext())
            {
                createdId = db.Books.Single(book => book.Title == "Refactoring").Id;
            }

            using (var controller = CreateController())
            {
                var result = controller.Edit(new Book
                {
                    Id = createdId,
                    Title = "Refactoring, Second Edition",
                    Author = "Martin Fowler",
                    ISBN = "9780134757599",
                    PublishedYear = 2018,
                    IsActive = true
                });
                Assert.IsType<RedirectToRouteResult>(result);
            }

            using (var controller = CreateController())
            {
                var result = controller.DeleteConfirmed(createdId);
                Assert.IsType<RedirectToRouteResult>(result);
            }

            using (var db = new ApplicationDbContext())
            {
                Assert.False(db.Books.Any(book => book.Id == createdId));
            }
        }

        [Fact]
        public void InvalidModelDoesNotCreateBook()
        {
            using (var controller = CreateController())
            {
                controller.ModelState.AddModelError("Title", "Title is required.");
                var result = Assert.IsType<ViewResult>(controller.Create(new Book { Author = "Unknown" }));
                Assert.IsType<Book>(result.Model);
            }

            using (var db = new ApplicationDbContext())
            {
                Assert.False(db.Books.Any(book => book.Author == "Unknown"));
            }
        }

        [Fact]
        public void BookValidationContractRejectsMissingAndOutOfRangeValues()
        {
            var book = new Book { PublishedYear = 1700 };
            var results = new List<ValidationResult>();

            Assert.False(Validator.TryValidateObject(book, new ValidationContext(book), results, true));
            Assert.Contains(results, result => result.MemberNames.Contains("Title"));
            Assert.Contains(results, result => result.MemberNames.Contains("Author"));
            Assert.Contains(results, result => result.MemberNames.Contains("PublishedYear"));
        }

        [Fact]
        public void MissingBookReturnsNotFound()
        {
            using (var controller = CreateController())
            {
                Assert.IsType<HttpNotFoundResult>(controller.Details(int.MaxValue));
                Assert.IsType<HttpNotFoundResult>(controller.Edit(int.MaxValue));
                Assert.IsType<HttpNotFoundResult>(controller.Delete(int.MaxValue));
            }
        }

        [Fact]
        public void DefaultRouteMapsToBooksIndex()
        {
            var routes = new RouteCollection();
            RouteConfig.RegisterRoutes(routes);
            var context = new StubHttpContext("~/", "GET", null);

            var routeData = routes.GetRouteData(context);

            Assert.NotNull(routeData);
            Assert.Equal("Books", routeData.Values["controller"]);
            Assert.Equal("Index", routeData.Values["action"]);
        }

        [Fact]
        public void MutatingActionsRequireAntiforgeryTokens()
        {
            var methods = typeof(BooksController).GetMethods(BindingFlags.Instance | BindingFlags.Public)
                .Where(method => method.GetCustomAttribute<HttpPostAttribute>() != null)
                .ToList();

            Assert.NotEmpty(methods);
            Assert.All(methods, method =>
                Assert.NotNull(method.GetCustomAttribute<ValidateAntiForgeryTokenAttribute>()));
        }

        [Fact]
        public void ConnectionStringLoadsFromConfiguration()
        {
            var connection = ConfigurationManager.ConnectionStrings["BookCatalogContext"];

            Assert.NotNull(connection);
            Assert.Contains("MSSQLLocalDB", connection.ConnectionString);
        }

        public void Dispose()
        {
            using (var db = new ApplicationDbContext())
            {
                db.Database.Delete();
            }
        }

        private static BooksController CreateController()
        {
            var controller = new BooksController();
            controller.ControllerContext = new ControllerContext(
                new StubHttpContext("~/Books", "GET", "CharacterizationTests/1.0"),
                new RouteData(),
                controller);
            return controller;
        }

        private sealed class StubHttpContext : HttpContextBase
        {
            private readonly HttpRequestBase request;

            public StubHttpContext(string path, string method, string userAgent)
            {
                request = new StubHttpRequest(path, method, userAgent);
            }

            public override HttpRequestBase Request => request;
        }

        private sealed class StubHttpRequest : HttpRequestBase
        {
            private readonly string path;
            private readonly string method;
            private readonly string userAgent;

            public StubHttpRequest(string path, string method, string userAgent)
            {
                this.path = path;
                this.method = method;
                this.userAgent = userAgent;
            }

            public override string AppRelativeCurrentExecutionFilePath => path;

            public override string PathInfo => string.Empty;

            public override string HttpMethod => method;

            public override string UserAgent => userAgent;
        }
    }
}

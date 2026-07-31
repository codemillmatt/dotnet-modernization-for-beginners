using BookCatalog.Web.Models;
using BookCatalog.Web.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookCatalog.Web.Controllers;

public class BooksController(ApplicationDbContext database) : Controller
{
    public async Task<IActionResult> Index()
    {
        var books = await database.Books
            .Where(book => book.IsActive)
            .OrderBy(book => book.Title)
            .AsNoTracking()
            .ToListAsync();

        ViewBag.UserAgent = Request.Headers.UserAgent.ToString();
        return View(books);
    }

    public async Task<IActionResult> Details(int id)
    {
        var book = await database.Books.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id);
        return book is null ? NotFound() : View(book);
    }

    public IActionResult Create() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Title,Author,ISBN,PublishedYear,IsActive")] Book book)
    {
        if (!ModelState.IsValid)
        {
            return View(book);
        }

        book.CreatedDate = DateTime.UtcNow;
        database.Books.Add(book);
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var book = await database.Books.FindAsync(id);
        return book is null ? NotFound() : View(book);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Title,Author,ISBN,PublishedYear,IsActive")] Book book)
    {
        if (id != book.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return View(book);
        }

        var existingBook = await database.Books.FindAsync(id);
        if (existingBook is null)
        {
            return NotFound();
        }

        existingBook.Title = book.Title;
        existingBook.Author = book.Author;
        existingBook.ISBN = book.ISBN;
        existingBook.PublishedYear = book.PublishedYear;
        existingBook.IsActive = book.IsActive;
        await database.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var book = await database.Books.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id);
        return book is null ? NotFound() : View(book);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var book = await database.Books.FindAsync(id);
        if (book is not null)
        {
            database.Books.Remove(book);
            await database.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index));
    }
}

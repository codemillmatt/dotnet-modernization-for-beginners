using BookCatalog.Web.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookCatalog.Web.Controllers;

public class BooksController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        var books = await db.Books.AsNoTracking().Where(b => b.IsActive).OrderBy(b => b.Title).ToListAsync();
        ViewBag.UserAgent = Request.Headers.UserAgent.ToString();
        return View(books);
    }

    public async Task<IActionResult> Details(int id)
    {
        var book = await db.Books.FindAsync(id);
        return book is null ? NotFound() : View(book);
    }

    public IActionResult Create() => View(new Book());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Title,Author,ISBN,PublishedYear,IsActive")] Book book)
    {
        if (!ModelState.IsValid) return View(book);
        book.CreatedDate = DateTime.Now;
        db.Books.Add(book);
        await db.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var book = await db.Books.FindAsync(id);
        return book is null ? NotFound() : View(book);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit([Bind("Id,Title,Author,ISBN,PublishedYear,IsActive")] Book book)
    {
        if (!ModelState.IsValid) return View(book);
        var existing = await db.Books.FindAsync(book.Id);
        if (existing is null) return NotFound();
        existing.Title = book.Title;
        existing.Author = book.Author;
        existing.ISBN = book.ISBN;
        existing.PublishedYear = book.PublishedYear;
        existing.IsActive = book.IsActive;
        await db.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var book = await db.Books.FindAsync(id);
        return book is null ? NotFound() : View(book);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var book = await db.Books.FindAsync(id);
        if (book is not null)
        {
            db.Books.Remove(book);
            await db.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }
}

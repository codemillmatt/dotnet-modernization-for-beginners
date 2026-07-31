using System.ComponentModel.DataAnnotations;

namespace BookCatalog.Core.Models;

public class Book
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Author { get; set; } = string.Empty;

    [StringLength(13)]
    public string? ISBN { get; set; }

    [Display(Name = "Published Year")]
    [Range(1800, 2100)]
    public int? PublishedYear { get; set; }

    [Display(Name = "Active")]
    public bool IsActive { get; set; } = true;

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}

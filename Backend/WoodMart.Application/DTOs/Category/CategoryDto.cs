namespace WoodMart.Application.DTOs.Category;

/// <summary>
/// DTO for product category information.
/// </summary>
public class CategoryDto
{
    /// <summary>
    /// Category ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Category name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Category description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category image URL.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Number of products in this category.
    /// </summary>
    public int ProductCount { get; set; }

    /// <summary>
    /// List of subcategories under this category.
    /// </summary>
    public List<SubcategoryDto> Subcategories { get; set; } = new();
}

/// <summary>
/// DTO for product subcategory information.
/// </summary>
public class SubcategoryDto
{
    /// <summary>
    /// Subcategory ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Parent category ID.
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Subcategory name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Subcategory description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Number of products in this subcategory.
    /// </summary>
    public int ProductCount { get; set; }
}

/// <summary>
/// DTO for creating/updating a category.
/// </summary>
public class CreateUpdateCategoryDto
{
    /// <summary>
    /// Category name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Category description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category image URL.
    /// </summary>
    public string? ImageUrl { get; set; }
}

/// <summary>
/// DTO for creating/updating a subcategory.
/// </summary>
public class CreateUpdateSubcategoryDto
{
    /// <summary>
    /// Parent category ID.
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Subcategory name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Subcategory description.
    /// </summary>
    public string? Description { get; set; }
}

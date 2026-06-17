using WoodMart.Application.DTOs.Category;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Service interface for category management operations.
/// </summary>
public interface ICategoryService
{
    /// <summary>
    /// Get all categories with their subcategories.
    /// </summary>
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();

    /// <summary>
    /// Get a specific category by ID with its subcategories.
    /// </summary>
    Task<CategoryDto?> GetCategoryByIdAsync(int id);

    /// <summary>
    /// Get all subcategories for a specific category.
    /// </summary>
    Task<IEnumerable<SubcategoryDto>> GetSubcategoriesByCategoryAsync(int categoryId);

    /// <summary>
    /// Get a specific subcategory by ID.
    /// </summary>
    Task<SubcategoryDto?> GetSubcategoryByIdAsync(int id);

    /// <summary>
    /// Create a new category.
    /// </summary>
    Task<(bool Success, string Message, CategoryDto? Category)> CreateCategoryAsync(CreateUpdateCategoryDto request);

    /// <summary>
    /// Update an existing category.
    /// </summary>
    Task<(bool Success, string Message, CategoryDto? Category)> UpdateCategoryAsync(int id, CreateUpdateCategoryDto request);

    /// <summary>
    /// Delete a category (only if it has no products).
    /// </summary>
    Task<(bool Success, string Message)> DeleteCategoryAsync(int id);

    /// <summary>
    /// Create a new subcategory.
    /// </summary>
    Task<(bool Success, string Message, SubcategoryDto? Subcategory)> CreateSubcategoryAsync(CreateUpdateSubcategoryDto request);

    /// <summary>
    /// Update an existing subcategory.
    /// </summary>
    Task<(bool Success, string Message, SubcategoryDto? Subcategory)> UpdateSubcategoryAsync(int id, CreateUpdateSubcategoryDto request);

    /// <summary>
    /// Delete a subcategory.
    /// </summary>
    Task<(bool Success, string Message)> DeleteSubcategoryAsync(int id);
}

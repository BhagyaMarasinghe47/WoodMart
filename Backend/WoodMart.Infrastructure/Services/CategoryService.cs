using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Category;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Service for category and subcategory management.
/// </summary>
public class CategoryService : ICategoryService
{
    private readonly IRepository<Category> _categoryRepository;
    private readonly IRepository<Subcategory> _subcategoryRepository;
    private readonly WoodMartDbContext _context;

    public CategoryService(
        IRepository<Category> categoryRepository,
        IRepository<Subcategory> subcategoryRepository,
        WoodMartDbContext context)
    {
        _categoryRepository = categoryRepository;
        _subcategoryRepository = subcategoryRepository;
        _context = context;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Subcategories)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var productCounts = await _context.VendorCatalogProducts
            .Where(v => v.IsPublished && v.CraftsmanProduct != null)
            .GroupBy(v => v.CraftsmanProduct!.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToListAsync();

        var countLookup = productCounts.ToDictionary(x => x.CategoryId, x => x.Count);

        return categories.Select(c => MapToDto(c, countLookup.GetValueOrDefault(c.Id, 0))).ToList();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return null;

        var productCount = await _context.VendorCatalogProducts.CountAsync(v =>
            v.IsPublished && v.CraftsmanProduct != null && v.CraftsmanProduct.CategoryId == id);

        return MapToDto(category, productCount);
    }

    public async Task<IEnumerable<SubcategoryDto>> GetSubcategoriesByCategoryAsync(int categoryId)
    {
        var subcategories = await _subcategoryRepository.FindAsync(s => s.CategoryId == categoryId);
        return subcategories.Select(MapSubcategoryToDto).ToList();
    }

    public async Task<SubcategoryDto?> GetSubcategoryByIdAsync(int id)
    {
        var subcategory = await _subcategoryRepository.GetByIdAsync(id);
        if (subcategory == null) return null;

        return MapSubcategoryToDto(subcategory);
    }

    public async Task<(bool Success, string Message, CategoryDto? Category)> CreateCategoryAsync(CreateUpdateCategoryDto request)
    {
        try
        {
            var category = new Category
            {
                Name = request.Name,
                Description = request.Description
            };

            await _categoryRepository.AddAsync(category);
            await _categoryRepository.SaveChangesAsync();

            return (true, "Category created successfully.", MapToDto(category));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to create category: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, CategoryDto? Category)> UpdateCategoryAsync(int id, CreateUpdateCategoryDto request)
    {
        try
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return (false, "Category not found.", null);

            category.Name = request.Name ?? category.Name;
            category.Description = request.Description ?? category.Description;

            await _categoryRepository.UpdateAsync(category);
            await _categoryRepository.SaveChangesAsync();

            return (true, "Category updated successfully.", MapToDto(category));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update category: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> DeleteCategoryAsync(int id)
    {
        try
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return (false, "Category not found.");

            // Check if category has products
            var subcategoryCount = await _subcategoryRepository.CountAsync(s => s.CategoryId == id);
            if (subcategoryCount > 0)
                return (false, "Cannot delete category with subcategories.");

            await _categoryRepository.DeleteAsync(category);
            await _categoryRepository.SaveChangesAsync();

            return (true, "Category deleted successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to delete category: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message, SubcategoryDto? Subcategory)> CreateSubcategoryAsync(CreateUpdateSubcategoryDto request)
    {
        try
        {
            var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
            if (category == null)
                return (false, "Parent category not found.", null);

            var subcategory = new Subcategory
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description
            };

            await _subcategoryRepository.AddAsync(subcategory);
            await _subcategoryRepository.SaveChangesAsync();

            return (true, "Subcategory created successfully.", MapSubcategoryToDto(subcategory));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to create subcategory: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, SubcategoryDto? Subcategory)> UpdateSubcategoryAsync(int id, CreateUpdateSubcategoryDto request)
    {
        try
        {
            var subcategory = await _subcategoryRepository.GetByIdAsync(id);
            if (subcategory == null)
                return (false, "Subcategory not found.", null);

            subcategory.Name = request.Name ?? subcategory.Name;
            subcategory.Description = request.Description ?? subcategory.Description;

            await _subcategoryRepository.UpdateAsync(subcategory);
            await _subcategoryRepository.SaveChangesAsync();

            return (true, "Subcategory updated successfully.", MapSubcategoryToDto(subcategory));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update subcategory: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> DeleteSubcategoryAsync(int id)
    {
        try
        {
            var subcategory = await _subcategoryRepository.GetByIdAsync(id);
            if (subcategory == null)
                return (false, "Subcategory not found.");

            await _subcategoryRepository.DeleteAsync(subcategory);
            await _subcategoryRepository.SaveChangesAsync();

            return (true, "Subcategory deleted successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to delete subcategory: {ex.Message}");
        }
    }

    private CategoryDto MapToDto(Category category, int productCount = 0)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = null,
            ProductCount = productCount,
            Subcategories = category.Subcategories?.Select(MapSubcategoryToDto).ToList() ?? new()
        };
    }

    private SubcategoryDto MapSubcategoryToDto(Subcategory subcategory)
    {
        return new SubcategoryDto
        {
            Id = subcategory.Id,
            CategoryId = subcategory.CategoryId,
            Name = subcategory.Name,
            Description = subcategory.Description,
            ProductCount = 0
        };
    }
}

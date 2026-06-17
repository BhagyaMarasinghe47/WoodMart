using WoodMart.Application.DTOs.Product;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Service interface for product management operations.
/// </summary>
public interface IProductService
{
    /// <summary>
    /// Get all products with pagination and filtering.
    /// </summary>
    Task<IEnumerable<ProductDto>> GetAllProductsAsync(int pageNumber = 1, int pageSize = 10);

    /// <summary>
    /// Get a product by ID.
    /// </summary>
    Task<ProductDto?> GetProductByIdAsync(int id);

    /// <summary>
    /// Get all products in a category.
    /// </summary>
    Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId);

    /// <summary>
    /// Get all products in a subcategory.
    /// </summary>
    Task<IEnumerable<ProductDto>> GetProductsBySubcategoryAsync(int subcategoryId);

    /// <summary>
    /// Search products by name.
    /// </summary>
    Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm);

    /// <summary>
    /// Get all craftsman products for a specific craftsman.
    /// </summary>
    Task<IEnumerable<CraftsmanProductDto>> GetCraftsmanProductsAsync(int craftsmanId);

    /// <summary>
    /// Get all vendor catalog products for a specific vendor.
    /// </summary>
    Task<IEnumerable<VendorCatalogProductDto>> GetVendorProductsAsync(int vendorId);

    /// <summary>
    /// Get published vendor catalog products for a store page.
    /// </summary>
    Task<IEnumerable<VendorCatalogProductDto>> GetPublishedVendorProductsAsync(int vendorId);

    /// <summary>
    /// Create a new product (craftsman or vendor).
    /// </summary>
    Task<(bool Success, string Message, ProductDto? Product)> CreateProductAsync(int userId, CreateUpdateProductDto request, string productType);

    /// <summary>
    /// Update an existing product.
    /// </summary>
    Task<(bool Success, string Message, ProductDto? Product)> UpdateProductAsync(int id, CreateUpdateProductDto request, int userId);

    /// <summary>
    /// Delete a product.
    /// </summary>
    Task<(bool Success, string Message)> DeleteProductAsync(int id, int userId);

    /// <summary>
    /// Get product count by category.
    /// </summary>
    Task<int> GetProductCountByCategoryAsync(int categoryId);
}

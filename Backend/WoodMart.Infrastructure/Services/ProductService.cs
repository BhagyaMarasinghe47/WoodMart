using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Product;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Service for product management (craftsman and vendor products).
/// </summary>
public class ProductService : IProductService
{
    private readonly IRepository<CraftsmanProduct> _craftsmanProductRepository;
    private readonly IRepository<VendorCatalogProduct> _vendorProductRepository;
    private readonly IRepository<Category> _categoryRepository;
    private readonly IRepository<Subcategory> _subcategoryRepository;
    private readonly WoodMartDbContext _context;

    public ProductService(
        IRepository<CraftsmanProduct> craftsmanProductRepository,
        IRepository<VendorCatalogProduct> vendorProductRepository,
        IRepository<Category> categoryRepository,
        IRepository<Subcategory> subcategoryRepository,
        WoodMartDbContext context)
    {
        _craftsmanProductRepository = craftsmanProductRepository;
        _vendorProductRepository = vendorProductRepository;
        _categoryRepository = categoryRepository;
        _subcategoryRepository = subcategoryRepository;
        _context = context;
    }

    private IQueryable<VendorCatalogProduct> PublishedCatalogQuery =>
        _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Category)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Subcategory)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Craftsman)
            .Include(v => v.Vendor)
            .Where(v => v.IsPublished);

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync(int pageNumber = 1, int pageSize = 100)
    {
        var products = await PublishedCatalogQuery
            .OrderByDescending(v => v.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var vendorProduct = await PublishedCatalogQuery
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendorProduct != null)
            return MapVendorToDto(vendorProduct);

        var craftsmanProduct = await _context.CraftsmanProducts
            .Include(cp => cp.Category)
            .Include(cp => cp.Subcategory)
            .Include(cp => cp.Craftsman)
            .FirstOrDefaultAsync(cp => cp.Id == id);

        if (craftsmanProduct != null)
            return MapCraftsmanToDto(craftsmanProduct);

        return null;
    }

    public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(int categoryId)
    {
        var products = await PublishedCatalogQuery
            .Where(v => v.CraftsmanProduct != null && v.CraftsmanProduct.CategoryId == categoryId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<IEnumerable<ProductDto>> GetProductsBySubcategoryAsync(int subcategoryId)
    {
        var products = await PublishedCatalogQuery
            .Where(v => v.CraftsmanProduct != null && v.CraftsmanProduct.SubcategoryId == subcategoryId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm)
    {
        var lowerSearch = searchTerm.ToLower();
        var products = await PublishedCatalogQuery
            .Where(v =>
                v.CraftsmanProduct != null &&
                (v.CraftsmanProduct.ProductName.ToLower().Contains(lowerSearch) ||
                 v.CraftsmanProduct.Description.ToLower().Contains(lowerSearch)))
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<IEnumerable<CraftsmanProductDto>> GetCraftsmanProductsAsync(int craftsmanId)
    {
        var products = await _context.CraftsmanProducts
            .Include(cp => cp.Category)
            .Include(cp => cp.Subcategory)
            .Where(p => p.CraftsmanId == craftsmanId)
            .ToListAsync();

        return products.Select(MapCraftsmanToDto);
    }

    public async Task<IEnumerable<VendorCatalogProductDto>> GetVendorProductsAsync(int vendorId)
    {
        var products = await _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Category)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Subcategory)
            .Include(v => v.Vendor)
            .Where(p => p.VendorId == vendorId)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<IEnumerable<VendorCatalogProductDto>> GetPublishedVendorProductsAsync(int vendorId)
    {
        var products = await _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Category)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Subcategory)
            .Include(v => v.Vendor)
            .Where(p => p.VendorId == vendorId && p.IsPublished)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return products.Select(MapVendorToDto);
    }

    public async Task<(bool Success, string Message, ProductDto? Product)> CreateProductAsync(int userId, CreateUpdateProductDto request, string productType)
    {
        try
        {
            if (productType == "craftsman")
            {
                var product = new CraftsmanProduct
                {
                    CraftsmanId = userId,
                    ProductName = request.Name,
                    Description = request.Description,
                    WholesalePrice = request.Price,
                    CategoryId = request.CategoryId,
                    SubcategoryId = request.SubcategoryId,
                    Sku = Guid.NewGuid().ToString().Substring(0, 8),
                    TotalStock = request.StockQuantity ?? 0,
                    Material = request.Material,
                    Dimensions = request.Dimensions,
                    Weight = request.Weight,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _craftsmanProductRepository.AddAsync(product);
                await _craftsmanProductRepository.SaveChangesAsync();
                return (true, "Craftsman product created successfully.", MapCraftsmanToDto(product));
            }

            if (productType == "vendor")
            {
                return (false, "Use craftsman product first, then add to vendor catalog.", null);
            }

            return (false, "Invalid product type.", null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to create product: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, ProductDto? Product)> UpdateProductAsync(int id, CreateUpdateProductDto request, int userId)
    {
        try
        {
            var craftsmanProduct = await _craftsmanProductRepository.GetByIdAsync(id);
            if (craftsmanProduct != null)
            {
                if (craftsmanProduct.CraftsmanId != userId)
                    return (false, "Unauthorized to update this product.", null);

                craftsmanProduct.ProductName = request.Name ?? craftsmanProduct.ProductName;
                craftsmanProduct.Description = request.Description ?? craftsmanProduct.Description;
                craftsmanProduct.WholesalePrice = request.Price > 0 ? request.Price : craftsmanProduct.WholesalePrice;
                craftsmanProduct.CategoryId = request.CategoryId > 0 ? request.CategoryId : craftsmanProduct.CategoryId;
                craftsmanProduct.SubcategoryId = request.SubcategoryId ?? craftsmanProduct.SubcategoryId;
                craftsmanProduct.Material = request.Material ?? craftsmanProduct.Material;
                craftsmanProduct.Dimensions = request.Dimensions ?? craftsmanProduct.Dimensions;
                craftsmanProduct.Weight = request.Weight ?? craftsmanProduct.Weight;
                craftsmanProduct.UpdatedAt = DateTime.UtcNow;

                await _craftsmanProductRepository.UpdateAsync(craftsmanProduct);
                await _craftsmanProductRepository.SaveChangesAsync();
                return (true, "Product updated successfully.", MapCraftsmanToDto(craftsmanProduct));
            }

            var vendorProduct = await _vendorProductRepository.GetByIdAsync(id);
            if (vendorProduct != null)
            {
                if (vendorProduct.VendorId != userId)
                    return (false, "Unauthorized to update this product.", null);

                vendorProduct.RetailPrice = request.Price > 0 ? request.Price : vendorProduct.RetailPrice;
                vendorProduct.AvailableStock = request.StockQuantity ?? vendorProduct.AvailableStock;
                vendorProduct.UpdatedAt = DateTime.UtcNow;

                await _vendorProductRepository.UpdateAsync(vendorProduct);
                await _vendorProductRepository.SaveChangesAsync();
                return (true, "Product updated successfully.", MapVendorToDto(vendorProduct));
            }

            return (false, "Product not found.", null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update product: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> DeleteProductAsync(int id, int userId)
    {
        try
        {
            var craftsmanProduct = await _craftsmanProductRepository.GetByIdAsync(id);
            if (craftsmanProduct != null)
            {
                if (craftsmanProduct.CraftsmanId != userId)
                    return (false, "Unauthorized to delete this product.");

                await _craftsmanProductRepository.DeleteAsync(craftsmanProduct);
                await _craftsmanProductRepository.SaveChangesAsync();
                return (true, "Product deleted successfully.");
            }

            var vendorProduct = await _vendorProductRepository.GetByIdAsync(id);
            if (vendorProduct != null)
            {
                if (vendorProduct.VendorId != userId)
                    return (false, "Unauthorized to delete this product.");

                await _vendorProductRepository.DeleteAsync(vendorProduct);
                await _vendorProductRepository.SaveChangesAsync();
                return (true, "Product deleted successfully.");
            }

            return (false, "Product not found.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to delete product: {ex.Message}");
        }
    }

    public async Task<int> GetProductCountByCategoryAsync(int categoryId)
    {
        return await PublishedCatalogQuery.CountAsync(v =>
            v.CraftsmanProduct != null && v.CraftsmanProduct.CategoryId == categoryId);
    }

    private static string? FormatUserName(User? user)
    {
        if (user == null) return null;
        return $"{user.FirstName} {user.LastName}".Trim();
    }

    private CraftsmanProductDto MapCraftsmanToDto(CraftsmanProduct product)
    {
        return new CraftsmanProductDto
        {
            Id = product.Id,
            Name = product.ProductName,
            Description = product.Description,
            Price = product.WholesalePrice,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            SubcategoryId = product.SubcategoryId,
            SubcategoryName = product.Subcategory?.Name,
            ImageUrl = product.ImageUrl,
            Material = product.Material,
            Dimensions = product.Dimensions,
            Weight = product.Weight,
            Status = "Active",
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CraftsmanId = product.CraftsmanId,
            CraftsmanName = FormatUserName(product.Craftsman),
            IsAvailable = product.TotalStock > 0
        };
    }

    private VendorCatalogProductDto MapVendorToDto(VendorCatalogProduct product)
    {
        var craftsmanProduct = product.CraftsmanProduct;
        return new VendorCatalogProductDto
        {
            Id = product.Id,
            Name = craftsmanProduct?.ProductName ?? "Unknown",
            Description = craftsmanProduct?.Description ?? string.Empty,
            Price = craftsmanProduct?.WholesalePrice ?? 0,
            CategoryId = craftsmanProduct?.CategoryId ?? 0,
            CategoryName = craftsmanProduct?.Category?.Name,
            SubcategoryId = craftsmanProduct?.SubcategoryId,
            SubcategoryName = craftsmanProduct?.Subcategory?.Name,
            ImageUrl = craftsmanProduct?.ImageUrl,
            Material = craftsmanProduct?.Material,
            Dimensions = craftsmanProduct?.Dimensions,
            Weight = craftsmanProduct?.Weight,
            Status = product.IsPublished ? "Published" : "Draft",
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CraftsmanProductId = product.CraftsmanProductId,
            CraftsmanId = craftsmanProduct?.CraftsmanId ?? 0,
            CraftsmanName = FormatUserName(craftsmanProduct?.Craftsman),
            VendorId = product.VendorId,
            VendorName = FormatUserName(product.Vendor),
            StockQuantity = product.AvailableStock,
            SellingPrice = product.RetailPrice,
            AverageRating = 0,
            ReviewCount = 0
        };
    }
}

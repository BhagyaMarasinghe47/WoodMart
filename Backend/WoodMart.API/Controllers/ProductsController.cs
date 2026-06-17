using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Product;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.API.Controllers;

/// <summary>
/// Product management endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly WoodMartDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        IProductService productService,
        WoodMartDbContext context,
        IWebHostEnvironment environment,
        ILogger<ProductsController> logger)
    {
        _productService = productService;
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Get all products with pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAllProducts([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 100)
    {
        try
        {
            var products = await _productService.GetAllProductsAsync(pageNumber, pageSize);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get product by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get products by category.
    /// </summary>
    [HttpGet("category/{categoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsByCategory(int categoryId)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryAsync(categoryId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products for category {CategoryId}", categoryId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get products by subcategory.
    /// </summary>
    [HttpGet("subcategory/{subcategoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsBySubcategory(int subcategoryId)
    {
        try
        {
            var products = await _productService.GetProductsBySubcategoryAsync(subcategoryId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching products for subcategory {SubcategoryId}", subcategoryId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Search products by name.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductDto>>> SearchProducts([FromQuery] string term)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(term))
                return BadRequest(new { message = "Search term is required" });

            var products = await _productService.SearchProductsAsync(term);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching products");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new product.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateUpdateProductDto request, [FromQuery] string productType = "craftsman")
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, product) = await _productService.CreateProductAsync(userId, request, productType);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetProductById), new { id = product?.Id }, product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing product.
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] CreateUpdateProductDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, product) = await _productService.UpdateProductAsync(id, request, userId);
            if (!success)
                return BadRequest(new { message });

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a product.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message) = await _productService.DeleteProductAsync(id, userId);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Product deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get craftsman products.
    /// </summary>
    [HttpGet("craftsman/{craftsmanId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CraftsmanProductDto>>> GetCraftsmanProducts(int craftsmanId)
    {
        try
        {
            var products = await _productService.GetCraftsmanProductsAsync(craftsmanId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching craftsman products");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get vendor products.
    /// </summary>
    [HttpGet("vendor/{vendorId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VendorCatalogProductDto>>> GetVendorProducts(int vendorId, [FromQuery] bool publishedOnly = false)
    {
        try
        {
            var products = publishedOnly
                ? await _productService.GetPublishedVendorProductsAsync(vendorId)
                : await _productService.GetVendorProductsAsync(vendorId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching vendor products");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Upload a product image. Returns the relative URL to the saved image.
    /// </summary>
    [HttpPost("upload-image")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadProductImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

        const long maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.Length > maxSize)
            return BadRequest(new { message = "Image must be under 5 MB." });

        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "images", "products");
        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"images/products/{fileName}";
        return Ok(new { imageUrl });
    }

    /// <summary>
    /// Seed sample published products for development/demo.
    /// </summary>
    [HttpPost("seed-sample")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedSampleProducts()
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        var craftsman = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role!.Name.ToLower().Contains("craftsman") && u.UserStatusId == 1)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync();

        var vendor = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role!.Name.ToLower().Contains("vendor") && u.UserStatusId == 1)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync();

        if (craftsman == null || vendor == null)
            return BadRequest(new { message = "Need at least one approved craftsman and vendor user." });

        if (!await _context.VendorCatalogProducts.AnyAsync(v => v.IsPublished))
        {
            var diningCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Dining"));
            var livingCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Living"));

            var cp1 = new CraftsmanProduct
            {
                CraftsmanId = craftsman.Id,
                ProductName = "Handcrafted Oak Dining Table",
                Description = "Beautiful solid oak dining table with smooth finish. Seats 6-8 people comfortably.",
                WholesalePrice = 45000,
                TotalStock = 15,
                CategoryId = diningCategory?.Id ?? 3,
                Sku = "WM-DT-001",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CraftsmanProducts.Add(cp1);
            await _context.SaveChangesAsync();

            _context.VendorCatalogProducts.Add(new VendorCatalogProduct
            {
                CraftsmanProductId = cp1.Id,
                VendorId = vendor.Id,
                RetailPrice = 69900,
                AvailableStock = 10,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            var cp2 = new CraftsmanProduct
            {
                CraftsmanId = craftsman.Id,
                ProductName = "Rustic Coffee Table",
                Description = "Elegant coffee table with storage compartment. Perfect for your living room.",
                WholesalePrice = 12000,
                TotalStock = 20,
                CategoryId = livingCategory?.Id ?? 2,
                Sku = "WM-CT-001",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CraftsmanProducts.Add(cp2);
            await _context.SaveChangesAsync();

            _context.VendorCatalogProducts.Add(new VendorCatalogProduct
            {
                CraftsmanProductId = cp2.Id,
                VendorId = vendor.Id,
                RetailPrice = 18900,
                AvailableStock = 15,
                IsPublished = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Sample products are available for browsing." });
    }

    /// <summary>
    /// Get product count by category.
    /// </summary>
    [HttpGet("category/{categoryId}/count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> GetProductCountByCategory(int categoryId)
    {
        try
        {
            var count = await _productService.GetProductCountByCategoryAsync(categoryId);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product count");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}

namespace WoodMart.Application.DTOs.Product;

/// <summary>
/// DTO for product information (shared between craftsman and vendor products).
/// </summary>
public class ProductDto
{
    /// <summary>
    /// Product ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Product name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Product description.
    /// </summary>
    public required string Description { get; set; }

    /// <summary>
    /// Product price.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Product category ID.
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Category name.
    /// </summary>
    public string? CategoryName { get; set; }

    /// <summary>
    /// Product subcategory ID.
    /// </summary>
    public int? SubcategoryId { get; set; }

    /// <summary>
    /// Subcategory name.
    /// </summary>
    public string? SubcategoryName { get; set; }

    /// <summary>
    /// Product image URL.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Product status (Active, Inactive, etc.).
    /// </summary>
    public string Status { get; set; } = "Active";

    /// <summary>
    /// Product material (e.g., Teak Wood, Oak).
    /// </summary>
    public string? Material { get; set; }

    /// <summary>
    /// Product dimensions (e.g., "72 × 36 × 30 cm").
    /// </summary>
    public string? Dimensions { get; set; }

    /// <summary>
    /// Product weight (e.g., "38.5 kg").
    /// </summary>
    public string? Weight { get; set; }

    /// <summary>
    /// Product creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Product last update timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for craftsman-created products.
/// </summary>
public class CraftsmanProductDto : ProductDto
{
    /// <summary>
    /// Craftsman/Creator ID.
    /// </summary>
    public int CraftsmanId { get; set; }

    /// <summary>
    /// Craftsman name.
    /// </summary>
    public string? CraftsmanName { get; set; }

    /// <summary>
    /// Product availability status.
    /// </summary>
    public bool IsAvailable { get; set; }
}

/// <summary>
/// DTO for vendor catalog products.
/// </summary>
public class VendorCatalogProductDto : ProductDto
{
    /// <summary>
    /// Source craftsman product ID.
    /// </summary>
    public int CraftsmanProductId { get; set; }

    /// <summary>
    /// Craftsman ID.
    /// </summary>
    public int CraftsmanId { get; set; }

    /// <summary>
    /// Craftsman display name.
    /// </summary>
    public string? CraftsmanName { get; set; }

    /// <summary>
    /// Vendor ID.
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Vendor name.
    /// </summary>
    public string? VendorName { get; set; }

    /// <summary>
    /// Product stock quantity.
    /// </summary>
    public int StockQuantity { get; set; }

    /// <summary>
    /// Vendor's selling price (may differ from original price).
    /// </summary>
    public decimal SellingPrice { get; set; }

    /// <summary>
    /// Average product rating.
    /// </summary>
    public decimal AverageRating { get; set; }

    /// <summary>
    /// Number of product reviews.
    /// </summary>
    public int ReviewCount { get; set; }
}

/// <summary>
/// DTO for creating/updating a product.
/// </summary>
public class CreateUpdateProductDto
{
    /// <summary>
    /// Product name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Product description.
    /// </summary>
    public required string Description { get; set; }

    /// <summary>
    /// Product price.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Category ID.
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Subcategory ID.
    /// </summary>
    public int? SubcategoryId { get; set; }

    /// <summary>
    /// Product image URL.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Stock quantity (for vendor products).
    /// </summary>
    public int? StockQuantity { get; set; }

    /// <summary>
    /// Product material.
    /// </summary>
    public string? Material { get; set; }

    /// <summary>
    /// Product dimensions string.
    /// </summary>
    public string? Dimensions { get; set; }

    /// <summary>
    /// Product weight string.
    /// </summary>
    public string? Weight { get; set; }
}

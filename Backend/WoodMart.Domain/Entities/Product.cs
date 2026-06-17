namespace WoodMart.Domain.Entities;

public class CraftsmanProduct
{
    public int Id { get; set; }
    public int CraftsmanId { get; set; }
    public string ProductName { get; set; }
    public string Description { get; set; }
    public decimal WholesalePrice { get; set; }
    public int TotalStock { get; set; }
    public int CategoryId { get; set; }
    public int? SubcategoryId { get; set; }
    public string Sku { get; set; }
    public string? ImageUrl { get; set; }
    public string? Material { get; set; }
    public string? Dimensions { get; set; }
    public string? Weight { get; set; }
    public bool IsDiscontinued { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User Craftsman { get; set; }
    public virtual Category Category { get; set; }
    public virtual Subcategory Subcategory { get; set; }
    public virtual ICollection<VendorCatalogProduct> VendorCatalogProducts { get; set; } = new List<VendorCatalogProduct>();
    public virtual ICollection<BulkOrderItem> BulkOrderItems { get; set; } = new List<BulkOrderItem>();
}

public class VendorCatalogProduct
{
    public int Id { get; set; }
    public int CraftsmanProductId { get; set; }
    public int VendorId { get; set; }
    public decimal RetailPrice { get; set; }
    public int AvailableStock { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual CraftsmanProduct CraftsmanProduct { get; set; }
    public virtual User Vendor { get; set; }
    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    public virtual ICollection<CustomerOrderItem> CustomerOrderItems { get; set; } = new List<CustomerOrderItem>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public decimal PriceMargin => RetailPrice - CraftsmanProduct.WholesalePrice;
}

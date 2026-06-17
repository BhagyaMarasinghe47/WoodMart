namespace WoodMart.Application.DTOs.Vendor;

public class AddVendorCatalogItemDto
{
    public int CraftsmanProductId { get; set; }
    public decimal RetailPrice { get; set; }
    public int Stock { get; set; }
}

public class UpdateVendorCatalogItemDto
{
    public decimal? RetailPrice { get; set; }
    public int? Stock { get; set; }
    public bool? IsPublished { get; set; }
}

public class UpdateVendorOrderStatusDto
{
    public required string Status { get; set; }
}

public class VendorDashboardStatsDto
{
    public int TotalProducts { get; set; }
    public int ProductsLowInStock { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int TotalCraftsmenConnected { get; set; }
    public decimal MonthlySales { get; set; }
}

public class VendorShopDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string OwnerName { get; set; }
    public string? Description { get; set; }
    public string? City { get; set; }
    public int PublishedProductCount { get; set; }
    public string? ImageUrl { get; set; }
}

public class CraftsmanListItemDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? City { get; set; }
    public int ProductsCount { get; set; }
}

public class CraftsmanProductBrowseDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public string? Subcategory { get; set; }
    public decimal WholesalePrice { get; set; }
    public int CraftsmanId { get; set; }
    public required string CraftsmanName { get; set; }
    public bool InVendorCatalog { get; set; }
    public string? ImageUrl { get; set; }
    public string? Material { get; set; }
    public int TotalStock { get; set; }
}

public class VendorOrderLineDto
{
    public required string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

public class VendorCustomerOrderDto
{
    public int Id { get; set; }
    public required string OrderNumber { get; set; }
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public List<VendorOrderLineDto> Products { get; set; } = new();
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public required string Status { get; set; }
}

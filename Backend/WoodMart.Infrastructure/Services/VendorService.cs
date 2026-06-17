using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Product;
using WoodMart.Application.DTOs.Vendor;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Services;

public class VendorService : IVendorService
{
    private const int ApprovedStatusId = 1;
    private const int CraftsmanRoleId = 2;
    private const int VendorRoleId = 3;

    private readonly WoodMartDbContext _context;
    private readonly IRepository<VendorCatalogProduct> _vendorProductRepository;

    public VendorService(
        WoodMartDbContext context,
        IRepository<VendorCatalogProduct> vendorProductRepository)
    {
        _context = context;
        _vendorProductRepository = vendorProductRepository;
    }

    public async Task<IEnumerable<VendorCatalogProductDto>> GetCatalogAsync(int vendorId) =>
        (await LoadVendorCatalogQuery(vendorId).ToListAsync()).Select(MapVendorToDto);

    public async Task<IEnumerable<VendorCatalogProductDto>> GetPublishedProductsAsync(int vendorId) =>
        (await LoadVendorCatalogQuery(vendorId).Where(p => p.IsPublished).ToListAsync()).Select(MapVendorToDto);

    public async Task<IEnumerable<VendorShopDto>> GetShopsAsync()
    {
        var vendors = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.RoleId == VendorRoleId && u.UserStatusId == ApprovedStatusId)
            .OrderBy(u => u.FirstName)
            .ToListAsync();

        var publishedProducts = await _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
            .Where(v => v.IsPublished)
            .ToListAsync();

        var productCounts = publishedProducts
            .GroupBy(v => v.VendorId)
            .ToDictionary(g => g.Key, g => g.Count());

        var firstImages = publishedProducts
            .Where(v => v.CraftsmanProduct?.ImageUrl != null)
            .GroupBy(v => v.VendorId)
            .ToDictionary(g => g.Key, g => g.First().CraftsmanProduct!.ImageUrl!);

        return vendors.Select(v => new VendorShopDto
        {
            Id = v.Id,
            Name = $"{v.FirstName} {v.LastName}".Trim(),
            OwnerName = $"{v.FirstName} {v.LastName}".Trim(),
            Description = "Handcrafted wooden furniture and home décor",
            City = v.City,
            PublishedProductCount = productCounts.GetValueOrDefault(v.Id, 0),
            ImageUrl = firstImages.GetValueOrDefault(v.Id)
        });
    }

    public async Task<VendorDashboardStatsDto> GetDashboardStatsAsync(int vendorId)
    {
        var catalog = await LoadVendorCatalogQuery(vendorId).ToListAsync();
        var orders = await LoadVendorOrdersQuery(vendorId).ToListAsync();

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return new VendorDashboardStatsDto
        {
            TotalProducts = catalog.Count(p => p.IsPublished),
            ProductsLowInStock = catalog.Count(p => p.IsPublished && p.AvailableStock < 5),
            TotalOrders = orders.Count,
            PendingOrders = orders.Count(o => o.OrderStatusId == 1 || o.OrderStatusId == 2),
            TotalCraftsmenConnected = await _context.Users.CountAsync(u =>
                u.RoleId == CraftsmanRoleId && u.UserStatusId == ApprovedStatusId),
            MonthlySales = orders
                .Where(o => o.CreatedAt >= monthStart)
                .SelectMany(o => o.CustomerOrderItems.Where(i => i.VendorCatalogProduct!.VendorId == vendorId))
                .Sum(i => i.Subtotal)
        };
    }

    public async Task<IEnumerable<VendorCustomerOrderDto>> GetCustomerOrdersAsync(int vendorId)
    {
        var orders = await LoadVendorOrdersQuery(vendorId).ToListAsync();
        return orders.Select(o => MapVendorOrder(o, vendorId));
    }

    public async Task<IEnumerable<CraftsmanListItemDto>> GetCraftsmenAsync()
    {
        var craftsmen = await _context.Users
            .Where(u => u.RoleId == CraftsmanRoleId && u.UserStatusId == ApprovedStatusId)
            .OrderBy(u => u.FirstName)
            .ToListAsync();

        var counts = await _context.CraftsmanProducts
            .GroupBy(cp => cp.CraftsmanId)
            .Select(g => new { CraftsmanId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CraftsmanId, x => x.Count);

        return craftsmen.Select(c => new CraftsmanListItemDto
        {
            Id = c.Id,
            Name = $"{c.FirstName} {c.LastName}".Trim(),
            Email = c.Email,
            City = c.City,
            ProductsCount = counts.GetValueOrDefault(c.Id, 0)
        });
    }

    public async Task<IEnumerable<CraftsmanProductBrowseDto>> GetCraftsmanProductsBrowseAsync(int vendorId, int? craftsmanId = null)
    {
        var inCatalog = await _context.VendorCatalogProducts
            .Where(v => v.VendorId == vendorId)
            .Select(v => v.CraftsmanProductId)
            .ToListAsync();

        var query = _context.CraftsmanProducts
            .Include(cp => cp.Category)
            .Include(cp => cp.Subcategory)
            .Include(cp => cp.Craftsman)
            .AsQueryable();

        if (craftsmanId.HasValue)
            query = query.Where(cp => cp.CraftsmanId == craftsmanId.Value);

        var products = await query.OrderByDescending(cp => cp.CreatedAt).ToListAsync();

        return products.Select(cp => new CraftsmanProductBrowseDto
        {
            Id = cp.Id,
            Name = cp.ProductName,
            Description = cp.Description,
            Category = cp.Category?.Name ?? "Uncategorized",
            Subcategory = cp.Subcategory?.Name,
            WholesalePrice = cp.WholesalePrice,
            CraftsmanId = cp.CraftsmanId,
            CraftsmanName = FormatName(cp.Craftsman),
            InVendorCatalog = inCatalog.Contains(cp.Id),
            ImageUrl = cp.ImageUrl,
            Material = cp.Material,
            TotalStock = cp.TotalStock
        });
    }

    public async Task<(bool Success, string Message, VendorCatalogProductDto? Product)> AddToCatalogAsync(
        int vendorId, AddVendorCatalogItemDto request)
    {
        try
        {
            if (request.RetailPrice <= 0)
                return (false, "Retail price must be greater than zero.", null);

            if (request.Stock < 0)
                return (false, "Stock cannot be negative.", null);

            var craftsmanProduct = await _context.CraftsmanProducts
                .Include(cp => cp.Category)
                .Include(cp => cp.Subcategory)
                .Include(cp => cp.Craftsman)
                .FirstOrDefaultAsync(cp => cp.Id == request.CraftsmanProductId);

            if (craftsmanProduct == null)
                return (false, "Craftsman product not found.", null);

            var exists = await _context.VendorCatalogProducts.AnyAsync(v =>
                v.VendorId == vendorId && v.CraftsmanProductId == request.CraftsmanProductId);

            if (exists)
                return (false, "This product is already in your catalog.", null);

            var catalogItem = new VendorCatalogProduct
            {
                CraftsmanProductId = request.CraftsmanProductId,
                VendorId = vendorId,
                RetailPrice = request.RetailPrice,
                AvailableStock = request.Stock,
                IsPublished = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _vendorProductRepository.AddAsync(catalogItem);
            await _vendorProductRepository.SaveChangesAsync();

            catalogItem.CraftsmanProduct = craftsmanProduct;
            catalogItem.Vendor = await _context.Users.FindAsync(vendorId);

            return (true, "Product added to catalog.", MapVendorToDto(catalogItem));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to add product: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, VendorCatalogProductDto? Product)> UpdateCatalogItemAsync(
        int vendorId, int catalogProductId, UpdateVendorCatalogItemDto request)
    {
        try
        {
            var product = await LoadVendorCatalogQuery(vendorId)
                .FirstOrDefaultAsync(v => v.Id == catalogProductId);

            if (product == null)
                return (false, "Catalog product not found.", null);

            if (request.RetailPrice.HasValue && request.RetailPrice.Value > 0)
                product.RetailPrice = request.RetailPrice.Value;

            if (request.Stock.HasValue && request.Stock.Value >= 0)
                product.AvailableStock = request.Stock.Value;

            if (request.IsPublished.HasValue)
                product.IsPublished = request.IsPublished.Value;

            product.UpdatedAt = DateTime.UtcNow;
            await _vendorProductRepository.UpdateAsync(product);
            await _vendorProductRepository.SaveChangesAsync();

            return (true, "Catalog product updated.", MapVendorToDto(product));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update product: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, VendorCatalogProductDto? Product)> TogglePublishAsync(
        int vendorId, int catalogProductId)
    {
        var product = await LoadVendorCatalogQuery(vendorId).FirstOrDefaultAsync(v => v.Id == catalogProductId);
        if (product == null)
            return (false, "Catalog product not found.", null);

        if (!product.IsPublished && product.AvailableStock <= 0)
            return (false, "Set stock before publishing.", null);

        product.IsPublished = !product.IsPublished;
        product.UpdatedAt = DateTime.UtcNow;
        await _vendorProductRepository.UpdateAsync(product);
        await _vendorProductRepository.SaveChangesAsync();

        return (true, product.IsPublished ? "Product published." : "Product unpublished.", MapVendorToDto(product));
    }

    public async Task<(bool Success, string Message)> RemoveFromCatalogAsync(int vendorId, int catalogProductId)
    {
        var product = await _vendorProductRepository.FirstOrDefaultAsync(v =>
            v.Id == catalogProductId && v.VendorId == vendorId);

        if (product == null)
            return (false, "Catalog product not found.");

        await _vendorProductRepository.DeleteAsync(product);
        await _vendorProductRepository.SaveChangesAsync();

        return (true, "Product removed from catalog.");
    }

    public async Task<(bool Success, string Message)> UpdateOrderStatusAsync(int vendorId, int orderId, string status)
    {
        var order = await _context.CustomerOrders
            .Include(o => o.CustomerOrderItems)
                .ThenInclude(i => i.VendorCatalogProduct)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            return (false, "Order not found.");

        if (!order.CustomerOrderItems.Any(i => i.VendorCatalogProduct?.VendorId == vendorId))
            return (false, "Order does not contain your products.");

        var statusMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            { "pending", 1 },
            { "processing", 2 },
            { "shipped", 3 },
            { "delivered", 4 },
            { "cancelled", 5 }
        };

        if (!statusMap.TryGetValue(status, out var statusId))
            return (false, "Invalid status.");

        order.OrderStatusId = statusId;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (true, "Order status updated.");
    }

    private IQueryable<VendorCatalogProduct> LoadVendorCatalogQuery(int vendorId) =>
        _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Category)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Subcategory)
            .Include(v => v.CraftsmanProduct)
                .ThenInclude(cp => cp!.Craftsman)
            .Include(v => v.Vendor)
            .Where(v => v.VendorId == vendorId);

    private IQueryable<CustomerOrder> LoadVendorOrdersQuery(int vendorId) =>
        _context.CustomerOrders
            .Include(o => o.Customer)
            .Include(o => o.OrderStatus)
            .Include(o => o.CustomerOrderItems)
                .ThenInclude(i => i.VendorCatalogProduct)
                    .ThenInclude(v => v!.CraftsmanProduct)
            .Where(o => o.CustomerOrderItems.Any(i => i.VendorCatalogProduct!.VendorId == vendorId))
            .OrderByDescending(o => o.CreatedAt);

    private static VendorCustomerOrderDto MapVendorOrder(CustomerOrder order, int vendorId)
    {
        var vendorItems = order.CustomerOrderItems
            .Where(i => i.VendorCatalogProduct?.VendorId == vendorId)
            .ToList();

        return new VendorCustomerOrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = FormatName(order.Customer),
            CustomerEmail = order.Customer?.Email ?? "",
            Products = vendorItems.Select(i => new VendorOrderLineDto
            {
                ProductName = i.VendorCatalogProduct?.CraftsmanProduct?.ProductName ?? "Product",
                Quantity = i.Quantity,
                Price = i.UnitPrice
            }).ToList(),
            TotalAmount = vendorItems.Sum(i => i.Subtotal),
            OrderDate = order.CreatedAt,
            Status = order.OrderStatus?.Name ?? GetStatusName(order.OrderStatusId)
        };
    }

    private static VendorCatalogProductDto MapVendorToDto(VendorCatalogProduct product)
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
            Status = product.IsPublished ? "Published" : "Draft",
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CraftsmanProductId = product.CraftsmanProductId,
            CraftsmanId = craftsmanProduct?.CraftsmanId ?? 0,
            CraftsmanName = FormatName(craftsmanProduct?.Craftsman),
            VendorId = product.VendorId,
            VendorName = FormatName(product.Vendor),
            StockQuantity = product.AvailableStock,
            SellingPrice = product.RetailPrice,
            AverageRating = 0,
            ReviewCount = 0
        };
    }

    private static string FormatName(User? user) =>
        user == null ? "Unknown" : $"{user.FirstName} {user.LastName}".Trim();

    private static string GetStatusName(int statusId) => statusId switch
    {
        1 => "Pending",
        2 => "Processing",
        3 => "Shipped",
        4 => "Delivered",
        5 => "Cancelled",
        _ => "Unknown"
    };
}

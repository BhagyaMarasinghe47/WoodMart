using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CraftsmanController : ControllerBase
{
    private readonly WoodMartDbContext _context;

    public CraftsmanController(WoodMartDbContext context)
    {
        _context = context;
    }

    // GET /api/craftsman/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var products = await _context.CraftsmanProducts
            .Where(p => p.CraftsmanId == craftsmanId)
            .ToListAsync();

        var orders = await _context.BulkOrders
            .Where(o => o.CraftsmanId == craftsmanId)
            .Include(o => o.BulkOrderStatus)
            .ToListAsync();

        var stats = new
        {
            totalProducts = products.Count(p => !p.IsDiscontinued),
            activeVendorOrders = orders.Count(o => o.BulkOrderStatus.Name != "Dispatched"),
            ordersInProduction = orders.Count(o => o.BulkOrderStatus.Name == "InProduction"),
            lowStockProducts = products.Count(p => p.TotalStock < 5 && !p.IsDiscontinued)
        };

        return Ok(stats);
    }

    // GET /api/craftsman/products
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var products = await _context.CraftsmanProducts
            .Where(p => p.CraftsmanId == craftsmanId)
            .Include(p => p.Category)
            .Include(p => p.Subcategory)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(products.Select(MapProduct));
    }

    // POST /api/craftsman/products
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CraftsmanProductRequest request)
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        try
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower().Replace(" ", "-") == request.Category.ToLower()
                                       || c.Name.ToLower() == request.Category.ToLower());

            if (category == null)
                return BadRequest(new { message = $"Category '{request.Category}' not found." });

            Subcategory? subcategory = null;
            if (!string.IsNullOrWhiteSpace(request.Subcategory))
            {
                subcategory = await _context.Subcategories
                    .FirstOrDefaultAsync(s => s.CategoryId == category.Id &&
                        s.Name.ToLower() == request.Subcategory.ToLower());
            }

            var sku = $"WM-{craftsmanId}-{DateTime.UtcNow.Ticks}";

            var product = new CraftsmanProduct
            {
                CraftsmanId = craftsmanId,
                ProductName = request.Name,
                Description = request.Description ?? "",
                WholesalePrice = request.WholesalePrice,
                TotalStock = request.AvailableQuantity,
                CategoryId = category.Id,
                SubcategoryId = subcategory?.Id,
                Sku = sku,
                ImageUrl = request.ImageUrl,
                Material = request.Material,
                Dimensions = request.Dimensions,
                Weight = request.Weight,
                IsDiscontinued = request.Status == "Discontinued",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CraftsmanProducts.Add(product);
            await _context.SaveChangesAsync();

            await _context.Entry(product).Reference(p => p.Category).LoadAsync();
            await _context.Entry(product).Reference(p => p.Subcategory).LoadAsync();

            return Ok(MapProduct(product));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Failed to save product: {ex.Message}" });
        }
    }

    // PUT /api/craftsman/products/{id}
    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] CraftsmanProductRequest request)
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var product = await _context.CraftsmanProducts
            .FirstOrDefaultAsync(p => p.Id == id && p.CraftsmanId == craftsmanId);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower().Replace(" ", "-") == request.Category.ToLower()
                                   || c.Name.ToLower() == request.Category.ToLower());

        if (category == null)
            return BadRequest(new { message = $"Category '{request.Category}' not found." });

        Subcategory? subcategory = null;
        if (!string.IsNullOrWhiteSpace(request.Subcategory))
        {
            subcategory = await _context.Subcategories
                .FirstOrDefaultAsync(s => s.CategoryId == category.Id &&
                    s.Name.ToLower() == request.Subcategory.ToLower());
        }

        product.ProductName = request.Name;
        product.Description = request.Description ?? product.Description;
        product.WholesalePrice = request.WholesalePrice;
        product.TotalStock = request.AvailableQuantity;
        product.CategoryId = category.Id;
        product.SubcategoryId = subcategory?.Id;
        product.ImageUrl = request.ImageUrl ?? product.ImageUrl;
        product.Material = request.Material;
        product.Dimensions = request.Dimensions;
        product.Weight = request.Weight;
        product.IsDiscontinued = request.Status == "Discontinued";
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(product).Reference(p => p.Category).LoadAsync();
        await _context.Entry(product).Reference(p => p.Subcategory).LoadAsync();

        return Ok(MapProduct(product));
    }

    // DELETE /api/craftsman/products/{id}
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var product = await _context.CraftsmanProducts
            .FirstOrDefaultAsync(p => p.Id == id && p.CraftsmanId == craftsmanId);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        _context.CraftsmanProducts.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Product deleted." });
    }

    // GET /api/craftsman/orders
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders()
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var orders = await _context.BulkOrders
            .Where(o => o.CraftsmanId == craftsmanId)
            .Include(o => o.Vendor)
            .Include(o => o.BulkOrderStatus)
            .Include(o => o.BulkOrderItems)
                .ThenInclude(i => i.CraftsmanProduct)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(MapOrder));
    }

    // PUT /api/craftsman/orders/{id}/status
    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateBulkOrderStatusRequest request)
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var order = await _context.BulkOrders
            .FirstOrDefaultAsync(o => o.Id == id && o.CraftsmanId == craftsmanId);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        var status = await _context.BulkOrderStatuses
            .FirstOrDefaultAsync(s => s.Name.ToLower() == request.Status.ToLower().Replace(" ", ""));

        if (status == null)
            return BadRequest(new { message = $"Invalid status: {request.Status}" });

        order.BulkOrderStatusId = status.Id;
        if (request.ExpectedDeliveryDate.HasValue)
            order.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Order status updated." });
    }

    // GET /api/craftsman/inventory
    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory()
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var products = await _context.CraftsmanProducts
            .Where(p => p.CraftsmanId == craftsmanId)
            .Include(p => p.Category)
            .Include(p => p.BulkOrderItems)
                .ThenInclude(i => i.BulkOrder)
                    .ThenInclude(o => o.BulkOrderStatus)
            .ToListAsync();

        var inventory = products.Select(p =>
        {
            var activeItems = p.BulkOrderItems
                .Where(i => i.BulkOrder.BulkOrderStatus.Name != "Dispatched")
                .ToList();

            var inProduction = p.BulkOrderItems
                .Where(i => i.BulkOrder.BulkOrderStatus.Name == "InProduction")
                .Sum(i => i.Quantity);

            var reserved = activeItems
                .Where(i => i.BulkOrder.BulkOrderStatus.Name is "Pending" or "Accepted" or "InProduction")
                .Sum(i => i.Quantity);

            return new
            {
                id = p.Id.ToString(),
                productId = p.Id.ToString(),
                productName = p.ProductName,
                category = p.Category?.Name ?? "",
                availableQuantity = p.TotalStock,
                inProduction,
                reserved,
                material = p.Material ?? "",
                wholesalePrice = p.WholesalePrice,
                status = p.IsDiscontinued ? "Discontinued" : p.TotalStock == 0 ? "Out of Stock" : "Active",
                lastUpdated = p.UpdatedAt
            };
        });

        return Ok(inventory);
    }

    // PUT /api/craftsman/inventory/{id}
    [HttpPut("inventory/{id}")]
    public async Task<IActionResult> UpdateInventory(int id, [FromBody] UpdateInventoryRequest request)
    {
        var craftsmanId = GetUserId();
        if (craftsmanId == 0) return Unauthorized();

        var product = await _context.CraftsmanProducts
            .FirstOrDefaultAsync(p => p.Id == id && p.CraftsmanId == craftsmanId);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        product.TotalStock = request.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Inventory updated." });
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private static object MapProduct(CraftsmanProduct p) => new
    {
        id = p.Id.ToString(),
        name = p.ProductName,
        description = p.Description,
        category = p.Category?.Name?.ToLower().Replace(" ", "-") ?? "",
        subcategory = p.Subcategory?.Name ?? "",
        wholesalePrice = p.WholesalePrice,
        availableQuantity = p.TotalStock,
        material = p.Material ?? "",
        dimensions = p.Dimensions ?? "",
        weight = p.Weight ?? "",
        imageUrl = p.ImageUrl ?? "",
        status = p.IsDiscontinued ? "Discontinued" : p.TotalStock == 0 ? "Out of Stock" : "Active",
        craftsmanId = p.CraftsmanId.ToString(),
        sku = p.Sku,
        createdAt = p.CreatedAt
    };

    private static object MapOrder(BulkOrder o)
    {
        var firstItem = o.BulkOrderItems.FirstOrDefault();
        return new
        {
            id = o.Id.ToString(),
            orderNumber = o.OrderNumber,
            vendorName = $"{o.Vendor?.FirstName} {o.Vendor?.LastName}".Trim(),
            vendorEmail = o.Vendor?.Email ?? "",
            productName = firstItem?.CraftsmanProduct?.ProductName ?? "",
            quantity = o.TotalQuantity,
            wholesalePrice = firstItem?.UnitCost ?? 0,
            totalAmount = o.TotalCost,
            orderDate = o.CreatedAt,
            expectedDeliveryDate = o.ExpectedDeliveryDate ?? o.CreatedAt.AddDays(30),
            status = MapBulkOrderStatus(o.BulkOrderStatus?.Name ?? "Pending"),
            notes = o.Notes ?? ""
        };
    }

    private static string MapBulkOrderStatus(string dbStatus) => dbStatus switch
    {
        "Pending" => "Pending",
        "Accepted" => "Accepted",
        "InProduction" => "In Production",
        "ReadyForDispatch" => "Ready for Dispatch",
        "Dispatched" => "Dispatched",
        _ => "Pending"
    };
}

public class CraftsmanProductRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string Category { get; set; } = "";
    public string? Subcategory { get; set; }
    public decimal WholesalePrice { get; set; }
    public int AvailableQuantity { get; set; }
    public string? Material { get; set; }
    public string? Dimensions { get; set; }
    public string? Weight { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Active";
}

public class UpdateBulkOrderStatusRequest
{
    public string Status { get; set; } = "";
    public DateTime? ExpectedDeliveryDate { get; set; }
}

public class UpdateInventoryRequest
{
    public int Quantity { get; set; }
}

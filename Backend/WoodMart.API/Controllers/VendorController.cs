using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Vendor;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendorController : ControllerBase
{
    private readonly IVendorService _vendorService;
    private readonly ILogger<VendorController> _logger;
    private readonly WoodMartDbContext _context;

    public VendorController(IVendorService vendorService, ILogger<VendorController> logger, WoodMartDbContext context)
    {
        _vendorService = vendorService;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// List approved vendor shops for the public shops page.
    /// </summary>
    [HttpGet("shops")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShops()
    {
        try
        {
            var shops = await _vendorService.GetShopsAsync();
            return Ok(shops);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching vendor shops");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("catalog")]
    [Authorize]
    public async Task<IActionResult> GetCatalog()
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var catalog = await _vendorService.GetCatalogAsync(vendorId);
        return Ok(catalog);
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<IActionResult> GetStats()
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var stats = await _vendorService.GetDashboardStatsAsync(vendorId);
        return Ok(stats);
    }

    [HttpGet("orders")]
    [Authorize]
    public async Task<IActionResult> GetOrders()
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var orders = await _vendorService.GetCustomerOrdersAsync(vendorId);
        return Ok(orders);
    }

    [HttpPut("orders/{orderId}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdateVendorOrderStatusDto request)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var (success, message) = await _vendorService.UpdateOrderStatusAsync(vendorId, orderId, request.Status);
        if (!success) return BadRequest(new { message });

        return Ok(new { message });
    }

    [HttpGet("craftsmen")]
    [Authorize]
    public async Task<IActionResult> GetCraftsmen()
    {
        if (GetUserId() == 0) return Unauthorized();

        var craftsmen = await _vendorService.GetCraftsmenAsync();
        return Ok(craftsmen);
    }

    [HttpGet("craftsman-products")]
    [Authorize]
    public async Task<IActionResult> GetCraftsmanProducts([FromQuery] int? craftsmanId = null)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var products = await _vendorService.GetCraftsmanProductsBrowseAsync(vendorId, craftsmanId);
        return Ok(products);
    }

    [HttpPost("catalog")]
    [Authorize]
    public async Task<IActionResult> AddToCatalog([FromBody] AddVendorCatalogItemDto request)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var (success, message, product) = await _vendorService.AddToCatalogAsync(vendorId, request);
        if (!success) return BadRequest(new { message });

        return Ok(product);
    }

    [HttpPut("catalog/{catalogProductId}")]
    [Authorize]
    public async Task<IActionResult> UpdateCatalogItem(int catalogProductId, [FromBody] UpdateVendorCatalogItemDto request)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var (success, message, product) = await _vendorService.UpdateCatalogItemAsync(vendorId, catalogProductId, request);
        if (!success) return BadRequest(new { message });

        return Ok(product);
    }

    [HttpPost("catalog/{catalogProductId}/publish")]
    [Authorize]
    public async Task<IActionResult> TogglePublish(int catalogProductId)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var (success, message, product) = await _vendorService.TogglePublishAsync(vendorId, catalogProductId);
        if (!success) return BadRequest(new { message });

        return Ok(product);
    }

    [HttpDelete("catalog/{catalogProductId}")]
    [Authorize]
    public async Task<IActionResult> RemoveFromCatalog(int catalogProductId)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        var (success, message) = await _vendorService.RemoveFromCatalogAsync(vendorId, catalogProductId);
        if (!success) return BadRequest(new { message });

        return Ok(new { message });
    }

    // GET /api/vendor/bulk-orders
    [HttpGet("bulk-orders")]
    [Authorize]
    public async Task<IActionResult> GetBulkOrders()
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        try
        {
            var orders = await _context.BulkOrders
                .Where(b => b.VendorId == vendorId)
                .Include(b => b.BulkOrderStatus)
                .Include(b => b.Craftsman)
                .Include(b => b.BulkOrderItems)
                    .ThenInclude(i => i.CraftsmanProduct)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return Ok(orders.Select(b => new
            {
                id = b.Id,
                orderNumber = b.OrderNumber,
                craftsmanId = b.CraftsmanId,
                craftsmanName = $"{b.Craftsman.FirstName} {b.Craftsman.LastName}".Trim(),
                status = b.BulkOrderStatus.Name,
                totalQuantity = b.TotalQuantity,
                totalCost = b.TotalCost,
                notes = b.Notes,
                createdAt = b.CreatedAt,
                items = b.BulkOrderItems.Select(i => new
                {
                    productName = i.CraftsmanProduct.ProductName,
                    quantity = i.Quantity,
                    unitCost = i.UnitCost,
                    subtotal = i.Subtotal
                })
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // POST /api/vendor/bulk-orders
    [HttpPost("bulk-orders")]
    [Authorize]
    public async Task<IActionResult> SubmitBulkOrder([FromBody] SubmitBulkOrderRequest req)
    {
        var vendorId = GetUserId();
        if (vendorId == 0) return Unauthorized();

        if (req.Quantity < 1)
            return BadRequest(new { message = "Quantity must be at least 1." });

        try
        {
            var product = await _context.CraftsmanProducts
                .FirstOrDefaultAsync(p => p.Id == req.CraftsmanProductId);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            var unitCost = req.AgreeUnitPrice > 0 ? req.AgreeUnitPrice : product.WholesalePrice;
            var subtotal = unitCost * req.Quantity;
            var orderNumber = $"BO-{DateTime.UtcNow:yyyyMMdd}-{vendorId}-{new Random().Next(1000, 9999)}";

            var order = new BulkOrder
            {
                VendorId = vendorId,
                CraftsmanId = product.CraftsmanId,
                OrderNumber = orderNumber,
                TotalQuantity = req.Quantity,
                TotalCost = subtotal,
                BulkOrderStatusId = 1, // Pending
                Notes = req.Notes ?? "",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.BulkOrders.Add(order);
            await _context.SaveChangesAsync();

            var item = new BulkOrderItem
            {
                BulkOrderId = order.Id,
                CraftsmanProductId = req.CraftsmanProductId,
                Quantity = req.Quantity,
                UnitCost = unitCost,
                Subtotal = subtotal,
                CreatedAt = DateTime.UtcNow
            };

            _context.BulkOrderItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bulk order submitted.", orderNumber, orderId = order.Id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }
}

public record SubmitBulkOrderRequest(int CraftsmanProductId, int Quantity, decimal AgreeUnitPrice, string? Notes);

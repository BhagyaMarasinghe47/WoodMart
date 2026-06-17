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
public class WishlistController : ControllerBase
{
    private readonly WoodMartDbContext _context;

    public WishlistController(WoodMartDbContext context)
    {
        _context = context;
    }

    // GET /api/wishlist
    [HttpGet]
    public async Task<IActionResult> GetWishlist()
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        try
        {
            var items = await _context.WishlistItems
                .Where(w => w.CustomerId == customerId)
                .Include(w => w.VendorCatalogProduct)
                    .ThenInclude(vcp => vcp.CraftsmanProduct)
                        .ThenInclude(cp => cp.Category)
                .Include(w => w.VendorCatalogProduct)
                    .ThenInclude(vcp => vcp.CraftsmanProduct)
                        .ThenInclude(cp => cp.Subcategory)
                .Include(w => w.VendorCatalogProduct)
                    .ThenInclude(vcp => vcp.CraftsmanProduct)
                        .ThenInclude(cp => cp.Craftsman)
                .Include(w => w.VendorCatalogProduct)
                    .ThenInclude(vcp => vcp.Vendor)
                .OrderByDescending(w => w.AddedAt)
                .ToListAsync();

            return Ok(items.Select(MapItem));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/wishlist/ids — just product IDs for quick lookup
    [HttpGet("ids")]
    public async Task<IActionResult> GetWishlistIds()
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        try
        {
            var ids = await _context.WishlistItems
                .Where(w => w.CustomerId == customerId)
                .Select(w => w.VendorCatalogProductId)
                .ToListAsync();

            return Ok(ids);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // POST /api/wishlist/{productId}
    [HttpPost("{productId:int}")]
    public async Task<IActionResult> AddToWishlist(int productId)
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        try
        {
            var product = await _context.VendorCatalogProducts
                .FirstOrDefaultAsync(p => p.Id == productId && p.IsPublished);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.VendorCatalogProductId == productId);
            if (existing != null)
                return Ok(new { message = "Already in wishlist.", alreadyExists = true });

            var item = new WishlistItem
            {
                CustomerId = customerId,
                VendorCatalogProductId = productId,
                AddedAt = DateTime.UtcNow
            };

            _context.WishlistItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Added to wishlist.", productId });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // DELETE /api/wishlist/{productId}
    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> RemoveFromWishlist(int productId)
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        try
        {
            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.VendorCatalogProductId == productId);

            if (item == null)
                return NotFound(new { message = "Item not in wishlist." });

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Removed from wishlist.", productId });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private static object MapItem(WishlistItem w)
    {
        var vcp = w.VendorCatalogProduct;
        var cp = vcp?.CraftsmanProduct;
        var imageUrl = cp?.ImageUrl ?? "";

        return new
        {
            id = w.Id,
            productId = vcp?.Id ?? 0,
            name = cp?.ProductName ?? "",
            description = cp?.Description ?? "",
            category = cp?.Category?.Name ?? "",
            subcategory = cp?.Subcategory?.Name ?? "",
            retailPrice = vcp?.RetailPrice ?? 0,
            wholesalePrice = cp?.WholesalePrice ?? 0,
            stock = vcp?.AvailableStock ?? 0,
            imageUrl,
            vendorName = $"{vcp?.Vendor?.FirstName} {vcp?.Vendor?.LastName}".Trim(),
            craftsmanName = $"{cp?.Craftsman?.FirstName} {cp?.Craftsman?.LastName}".Trim(),
            addedAt = w.AddedAt
        };
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly WoodMartDbContext _context;

    public ReviewsController(WoodMartDbContext context)
    {
        _context = context;
    }

    // GET /api/reviews/product/{productId}
    [HttpGet("product/{productId:int}")]
    public async Task<IActionResult> GetProductReviews(int productId)
    {
        try
        {
            var reviews = await _context.Reviews
                .Where(r => r.VendorCatalogProductId == productId)
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    customerId = r.CustomerId,
                    customerName = $"{r.Customer.FirstName} {r.Customer.LastName}".Trim(),
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedAt
                })
                .ToListAsync();

            var avgRating = reviews.Count > 0 ? reviews.Average(r => r.rating) : 0.0;

            return Ok(new
            {
                reviews,
                averageRating = Math.Round(avgRating, 1),
                reviewCount = reviews.Count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // POST /api/reviews/product/{productId}
    [HttpPost("product/{productId:int}")]
    [Authorize]
    public async Task<IActionResult> SubmitReview(int productId, [FromBody] SubmitReviewRequest req)
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        if (req.Rating < 1 || req.Rating > 5)
            return BadRequest(new { message = "Rating must be between 1 and 5." });

        try
        {
            var product = await _context.VendorCatalogProducts
                .FirstOrDefaultAsync(p => p.Id == productId && p.IsPublished);
            if (product == null)
                return NotFound(new { message = "Product not found." });

            var existing = await _context.Reviews
                .FirstOrDefaultAsync(r => r.CustomerId == customerId && r.VendorCatalogProductId == productId);

            if (existing != null)
            {
                existing.Rating = req.Rating;
                existing.Comment = req.Comment?.Trim() ?? "";
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Review updated.", reviewId = existing.Id });
            }

            var review = new Review
            {
                CustomerId = customerId,
                VendorCatalogProductId = productId,
                Rating = req.Rating,
                Comment = req.Comment?.Trim() ?? "",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Review submitted.", reviewId = review.Id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // DELETE /api/reviews/{reviewId}
    [HttpDelete("{reviewId:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int reviewId)
    {
        var customerId = GetUserId();
        if (customerId == 0) return Unauthorized();

        try
        {
            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

            if (review == null)
                return NotFound(new { message = "Review not found or not yours." });

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Review deleted." });
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
}

public record SubmitReviewRequest(int Rating, string? Comment);

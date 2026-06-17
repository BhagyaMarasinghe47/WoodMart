using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.DTOs.Cart;
using WoodMart.Application.Interfaces;

namespace WoodMart.API.Controllers;

/// <summary>
/// Shopping cart endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ILogger<CartController> _logger;

    public CartController(ICartService cartService, ILogger<CartController> logger)
    {
        _cartService = cartService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's shopping cart.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ShoppingCartDto>> GetCart()
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var cart = await _cartService.GetCartByCustomerIdAsync(customerId);
            return Ok(cart ?? new ShoppingCartDto { CustomerId = customerId, Items = new(), ItemCount = 0, Subtotal = 0, Total = 0 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Add item to cart.
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ShoppingCartDto>> AddToCart([FromBody] AddUpdateCartItemDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, cart) = await _cartService.AddToCartAsync(customerId, request.ProductId, request.Quantity);
            if (!success)
                return BadRequest(new { message });

            return Ok(cart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update cart item quantity.
    /// </summary>
    [HttpPut("items/{cartItemId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ShoppingCartDto>> UpdateCartItemQuantity(int cartItemId, [FromBody] AddUpdateCartItemDto request)
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, cart) = await _cartService.UpdateCartItemQuantityAsync(customerId, cartItemId, request.Quantity);
            if (!success)
                return BadRequest(new { message });

            return Ok(cart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Remove item from cart.
    /// </summary>
    [HttpDelete("items/{cartItemId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ShoppingCartDto>> RemoveFromCart(int cartItemId)
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, cart) = await _cartService.RemoveFromCartAsync(customerId, cartItemId);
            if (!success)
                return BadRequest(new { message });

            return Ok(cart);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Clear entire cart.
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClearCart()
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message) = await _cartService.ClearCartAsync(customerId);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Cart cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get cart total.
    /// </summary>
    [HttpGet("total")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<decimal>> GetCartTotal()
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var total = await _cartService.GetCartTotalAsync(customerId);
            return Ok(new { total });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cart total");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Check if product is in cart.
    /// </summary>
    [HttpGet("contains/{productId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<bool>> IsProductInCart(int productId)
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var isInCart = await _cartService.IsProductInCartAsync(customerId, productId);
            return Ok(new { isInCart });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking product in cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}

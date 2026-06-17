using WoodMart.Application.DTOs.Cart;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Service interface for shopping cart operations.
/// </summary>
public interface ICartService
{
    /// <summary>
    /// Get shopping cart for a customer.
    /// </summary>
    Task<ShoppingCartDto?> GetCartByCustomerIdAsync(int customerId);

    /// <summary>
    /// Add or update item in shopping cart.
    /// </summary>
    Task<(bool Success, string Message, ShoppingCartDto? Cart)> AddToCartAsync(int customerId, int productId, int quantity);

    /// <summary>
    /// Remove item from shopping cart.
    /// </summary>
    Task<(bool Success, string Message, ShoppingCartDto? Cart)> RemoveFromCartAsync(int customerId, int cartItemId);

    /// <summary>
    /// Update quantity of item in cart.
    /// </summary>
    Task<(bool Success, string Message, ShoppingCartDto? Cart)> UpdateCartItemQuantityAsync(int customerId, int cartItemId, int quantity);

    /// <summary>
    /// Clear all items from shopping cart.
    /// </summary>
    Task<(bool Success, string Message)> ClearCartAsync(int customerId);

    /// <summary>
    /// Get total price of shopping cart.
    /// </summary>
    Task<decimal> GetCartTotalAsync(int customerId);

    /// <summary>
    /// Check if product is in cart.
    /// </summary>
    Task<bool> IsProductInCartAsync(int customerId, int productId);
}

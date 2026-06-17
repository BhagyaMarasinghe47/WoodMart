namespace WoodMart.Application.DTOs.Cart;

/// <summary>
/// DTO for shopping cart item information.
/// </summary>
public class CartItemDto
{
    /// <summary>
    /// Cart item ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Product ID in the cart.
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// Product name.
    /// </summary>
    public required string ProductName { get; set; }

    /// <summary>
    /// Product price at time of adding to cart.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Quantity of product in cart.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Total price for this item (price * quantity).
    /// </summary>
    public decimal TotalPrice { get; set; }

    /// <summary>
    /// Product image URL.
    /// </summary>
    public string? ProductImageUrl { get; set; }

    /// <summary>
    /// Available stock for the vendor catalog product.
    /// </summary>
    public int AvailableStock { get; set; }

    /// <summary>
    /// Timestamp when item was added to cart.
    /// </summary>
    public DateTime AddedAt { get; set; }
}

/// <summary>
/// DTO for complete shopping cart information.
/// </summary>
public class ShoppingCartDto
{
    /// <summary>
    /// Shopping cart ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Customer ID who owns the cart.
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// List of items in the shopping cart.
    /// </summary>
    public List<CartItemDto> Items { get; set; } = new();

    /// <summary>
    /// Total number of items in cart.
    /// </summary>
    public int ItemCount { get; set; }

    /// <summary>
    /// Subtotal price (before taxes/shipping).
    /// </summary>
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Total price including any applicable charges.
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Last updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for adding/updating item in cart.
/// </summary>
public class AddUpdateCartItemDto
{
    /// <summary>
    /// Product ID to add/update.
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// Quantity to add/update.
    /// </summary>
    public int Quantity { get; set; }
}

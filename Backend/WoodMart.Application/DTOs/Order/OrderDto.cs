namespace WoodMart.Application.DTOs.Order;

/// <summary>
/// DTO for order item information.
/// </summary>
public class OrderItemDto
{
    /// <summary>
    /// Order item ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Product ID in the order.
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// Product name.
    /// </summary>
    public required string ProductName { get; set; }

    /// <summary>
    /// Product price at time of purchase.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Quantity purchased.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Total price for this item.
    /// </summary>
    public decimal TotalPrice { get; set; }
}

/// <summary>
/// DTO for customer order information.
/// </summary>
public class CustomerOrderDto
{
    /// <summary>
    /// Order ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Human-readable order number.
    /// </summary>
    public string? OrderNumber { get; set; }

    /// <summary>
    /// Customer/Buyer ID.
    /// </summary>
    public int CustomerId { get; set; }

    /// <summary>
    /// Order date.
    /// </summary>
    public DateTime OrderDate { get; set; }

    /// <summary>
    /// Expected delivery date.
    /// </summary>
    public DateTime? DeliveryDate { get; set; }

    /// <summary>
    /// Delivery address.
    /// </summary>
    public required string DeliveryAddress { get; set; }

    public string? DeliveryCity { get; set; }
    public string? DeliveryState { get; set; }
    public string? DeliveryPostalCode { get; set; }
    public string? DeliveryCountry { get; set; }

    /// <summary>
    /// Order status (Pending, Processing, Shipped, Delivered, Cancelled).
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Total order amount.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Order notes/comments.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Items in the order.
    /// </summary>
    public List<OrderItemDto> Items { get; set; } = new();

    /// <summary>
    /// Payment information for the order.
    /// </summary>
    public PaymentInfoDto? Payment { get; set; }
}

/// <summary>
/// DTO for bulk order information.
/// </summary>
public class BulkOrderDto
{
    /// <summary>
    /// Bulk order ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Buyer ID (can be customer or vendor).
    /// </summary>
    public int BuyerId { get; set; }

    /// <summary>
    /// Seller ID (craftsman or vendor providing bulk order).
    /// </summary>
    public int SellerId { get; set; }

    /// <summary>
    /// Product ID for bulk order.
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// Product name.
    /// </summary>
    public required string ProductName { get; set; }

    /// <summary>
    /// Quantity requested in bulk order.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Price per unit.
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Total order value.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Bulk order status.
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Special requirements or notes for the bulk order.
    /// </summary>
    public string? SpecialRequirements { get; set; }

    /// <summary>
    /// Order creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for creating a new customer order.
/// </summary>
public class CreateOrderDto
{
    /// <summary>
    /// Delivery address for the order.
    /// </summary>
    public required string DeliveryAddress { get; set; }

    /// <summary>
    /// Optional notes for the order.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// List of products to include in the order (from shopping cart or direct).
    /// </summary>
    public List<OrderItemInputDto> Items { get; set; } = new();
}

/// <summary>
/// DTO for order item input during order creation.
/// </summary>
public class OrderItemInputDto
{
    /// <summary>
    /// Product ID.
    /// </summary>
    public int ProductId { get; set; }

    /// <summary>
    /// Quantity to order.
    /// </summary>
    public int Quantity { get; set; }
}

/// <summary>
/// DTO for placing an order from the customer's shopping cart.
/// </summary>
public class CreateOrderFromCartDto
{
    public required string DeliveryAddress { get; set; }
    public string? DeliveryCity { get; set; }
    public string? DeliveryPostalCode { get; set; }
    public string? Notes { get; set; }
    public int PaymentMethodId { get; set; } = 1;
}

/// <summary>
/// Basic payment information for orders.
/// </summary>
public class PaymentInfoDto
{
    /// <summary>
    /// Payment ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Payment method (Card, Bank Transfer, etc.).
    /// </summary>
    public required string PaymentMethod { get; set; }

    /// <summary>
    /// Payment status (Pending, Completed, Failed).
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Payment amount.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Payment date.
    /// </summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// Transaction ID from payment gateway.
    /// </summary>
    public string? TransactionId { get; set; }
}

using WoodMart.Application.DTOs.Order;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Service interface for order management operations.
/// </summary>
public interface IOrderService
{
    /// <summary>
    /// Get all orders for a customer.
    /// </summary>
    Task<IEnumerable<CustomerOrderDto>> GetCustomerOrdersAsync(int customerId);

    /// <summary>
    /// Get a specific order by ID.
    /// </summary>
    Task<CustomerOrderDto?> GetOrderByIdAsync(int orderId);

    /// <summary>
    /// Get order by ID if it belongs to the customer.
    /// </summary>
    Task<CustomerOrderDto?> GetOrderForCustomerAsync(int orderId, int customerId);

    /// <summary>
    /// Create a new order from customer request.
    /// </summary>
    Task<(bool Success, string Message, CustomerOrderDto? Order)> CreateOrderAsync(int customerId, CreateOrderDto request);

    /// <summary>
    /// Create an order from the customer's current shopping cart.
    /// </summary>
    Task<(bool Success, string Message, CustomerOrderDto? Order)> CreateOrderFromCartAsync(int customerId, CreateOrderFromCartDto request);

    /// <summary>
    /// Update order status.
    /// </summary>
    Task<(bool Success, string Message)> UpdateOrderStatusAsync(int orderId, string newStatus, int adminId);

    /// <summary>
    /// Cancel an order (only if not shipped).
    /// </summary>
    Task<(bool Success, string Message)> CancelOrderAsync(int orderId, int customerId);

    /// <summary>
    /// Get orders by status.
    /// </summary>
    Task<IEnumerable<CustomerOrderDto>> GetOrdersByStatusAsync(string status);

    /// <summary>
    /// Get bulk orders for a seller.
    /// </summary>
    Task<IEnumerable<BulkOrderDto>> GetBulkOrdersForSellerAsync(int sellerId);

    /// <summary>
    /// Get bulk orders for a buyer.
    /// </summary>
    Task<IEnumerable<BulkOrderDto>> GetBulkOrdersForBuyerAsync(int buyerId);

    /// <summary>
    /// Create a bulk order.
    /// </summary>
    Task<(bool Success, string Message, BulkOrderDto? BulkOrder)> CreateBulkOrderAsync(int buyerId, int sellerId, int productId, int quantity, decimal unitPrice, string specialRequirements);

    /// <summary>
    /// Update bulk order status.
    /// </summary>
    Task<(bool Success, string Message)> UpdateBulkOrderStatusAsync(int bulkOrderId, string newStatus);
}

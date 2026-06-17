using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Order;
using WoodMart.Application.DTOs.Payment;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Service for order management.
/// </summary>
public class OrderService : IOrderService
{
    private readonly WoodMartDbContext _context;
    private readonly IRepository<CustomerOrder> _orderRepository;
    private readonly IRepository<CustomerOrderItem> _orderItemRepository;
    private readonly IRepository<BulkOrder> _bulkOrderRepository;
    private readonly IRepository<BulkOrderItem> _bulkOrderItemRepository;
    private readonly IRepository<ShoppingCart> _cartRepository;
    private readonly IRepository<CartItem> _cartItemRepository;
    private readonly IRepository<Payment> _paymentRepository;

    public OrderService(
        WoodMartDbContext context,
        IRepository<CustomerOrder> orderRepository,
        IRepository<CustomerOrderItem> orderItemRepository,
        IRepository<BulkOrder> bulkOrderRepository,
        IRepository<BulkOrderItem> bulkOrderItemRepository,
        IRepository<ShoppingCart> cartRepository,
        IRepository<CartItem> cartItemRepository,
        IRepository<Payment> paymentRepository)
    {
        _context = context;
        _orderRepository = orderRepository;
        _orderItemRepository = orderItemRepository;
        _bulkOrderRepository = bulkOrderRepository;
        _bulkOrderItemRepository = bulkOrderItemRepository;
        _cartRepository = cartRepository;
        _cartItemRepository = cartItemRepository;
        _paymentRepository = paymentRepository;
    }

    public async Task<IEnumerable<CustomerOrderDto>> GetCustomerOrdersAsync(int customerId)
    {
        var orders = await _context.CustomerOrders
            .Include(o => o.CustomerOrderItems)
                .ThenInclude(i => i.VendorCatalogProduct)
                    .ThenInclude(v => v!.CraftsmanProduct)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentMethod)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<CustomerOrderDto?> GetOrderByIdAsync(int orderId)
    {
        var order = await LoadOrderAsync(orderId);
        return order == null ? null : MapToDto(order);
    }

    public async Task<CustomerOrderDto?> GetOrderForCustomerAsync(int orderId, int customerId)
    {
        var order = await LoadOrderAsync(orderId);
        if (order == null || order.CustomerId != customerId)
            return null;

        return MapToDto(order);
    }

    public async Task<(bool Success, string Message, CustomerOrderDto? Order)> CreateOrderFromCartAsync(
        int customerId,
        CreateOrderFromCartDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.DeliveryAddress))
                return (false, "Delivery address is required.", null);

            var cart = await _context.ShoppingCarts
                .Include(sc => sc.CartItems)
                    .ThenInclude(ci => ci.VendorCatalogProduct)
                        .ThenInclude(v => v!.CraftsmanProduct)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null || !cart.CartItems.Any())
                return (false, "Your cart is empty.", null);

            var paymentMethod = await _context.Set<PaymentMethod>()
                .FirstOrDefaultAsync(pm => pm.Id == request.PaymentMethodId);
            if (paymentMethod == null)
                return (false, "Invalid payment method.", null);

            foreach (var item in cart.CartItems)
            {
                var product = item.VendorCatalogProduct;
                if (product == null || !product.IsPublished)
                    return (false, "One or more products in your cart are no longer available.", null);

                if (item.Quantity > product.AvailableStock)
                {
                    var name = product.CraftsmanProduct?.ProductName ?? "Product";
                    return (false, $"Insufficient stock for {name}. Only {product.AvailableStock} available.", null);
                }
            }

            var orderNumber = $"WM-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
            var order = new CustomerOrder
            {
                CustomerId = customerId,
                OrderNumber = orderNumber,
                DeliveryAddress = request.DeliveryAddress.Trim(),
                DeliveryCity = request.DeliveryCity?.Trim() ?? "",
                DeliveryState = "",
                DeliveryPostalCode = request.DeliveryPostalCode?.Trim() ?? "",
                DeliveryCountry = "Sri Lanka",
                Notes = request.Notes?.Trim() ?? "",
                OrderStatusId = 2, // Processing after payment
                TotalAmount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _orderRepository.AddAsync(order);
            await _orderRepository.SaveChangesAsync();

            decimal totalAmount = 0;
            foreach (var cartItem in cart.CartItems)
            {
                var product = cartItem.VendorCatalogProduct!;
                var unitPrice = product.RetailPrice;
                var subtotal = unitPrice * cartItem.Quantity;
                totalAmount += subtotal;

                var orderItem = new CustomerOrderItem
                {
                    CustomerOrderId = order.Id,
                    VendorCatalogProductId = cartItem.VendorCatalogProductId,
                    Quantity = cartItem.Quantity,
                    UnitPrice = unitPrice,
                    Subtotal = subtotal,
                    CreatedAt = DateTime.UtcNow
                };
                await _orderItemRepository.AddAsync(orderItem);

                product.AvailableStock -= cartItem.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            order.TotalAmount = totalAmount;
            await _orderRepository.UpdateAsync(order);

            foreach (var cartItem in cart.CartItems.ToList())
            {
                await _cartItemRepository.DeleteAsync(cartItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.UpdateAsync(cart);

            var transactionId = $"TXN-{Guid.NewGuid():N}";
            var payment = new Payment
            {
                CustomerOrderId = order.Id,
                Amount = totalAmount,
                PaymentMethodId = request.PaymentMethodId,
                PaymentStatusId = 2, // Completed (demo checkout)
                TransactionId = transactionId,
                PaymentReference = orderNumber,
                Notes = $"Checkout via {paymentMethod.Name}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _paymentRepository.AddAsync(payment);

            await _orderItemRepository.SaveChangesAsync();
            await _orderRepository.SaveChangesAsync();

            var created = await LoadOrderAsync(order.Id);
            return (true, "Order placed successfully.", created == null ? null : MapToDto(created));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to place order: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, CustomerOrderDto? Order)> CreateOrderAsync(int customerId, CreateOrderDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.DeliveryAddress))
                return (false, "Delivery address is required.", null);

            if (request.Items == null || !request.Items.Any())
                return (false, "Order must contain at least one item.", null);

            var orderNumber = $"WM-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
            var order = new CustomerOrder
            {
                CustomerId = customerId,
                OrderNumber = orderNumber,
                DeliveryAddress = request.DeliveryAddress.Trim(),
                DeliveryCity = "",
                DeliveryState = "",
                DeliveryPostalCode = "",
                DeliveryCountry = "Sri Lanka",
                Notes = request.Notes?.Trim() ?? "",
                OrderStatusId = 1,
                TotalAmount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _orderRepository.AddAsync(order);
            await _orderRepository.SaveChangesAsync();

            decimal totalAmount = 0;
            foreach (var item in request.Items)
            {
                var product = await _context.VendorCatalogProducts
                    .Include(v => v.CraftsmanProduct)
                    .FirstOrDefaultAsync(v => v.Id == item.ProductId && v.IsPublished);

                if (product == null)
                    return (false, $"Product {item.ProductId} is not available.", null);

                if (item.Quantity > product.AvailableStock)
                    return (false, $"Insufficient stock for product {item.ProductId}.", null);

                var unitPrice = product.RetailPrice;
                var subtotal = unitPrice * item.Quantity;
                totalAmount += subtotal;

                await _orderItemRepository.AddAsync(new CustomerOrderItem
                {
                    CustomerOrderId = order.Id,
                    VendorCatalogProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = unitPrice,
                    Subtotal = subtotal,
                    CreatedAt = DateTime.UtcNow
                });

                product.AvailableStock -= item.Quantity;
            }

            order.TotalAmount = totalAmount;
            await _orderRepository.UpdateAsync(order);
            await _orderItemRepository.SaveChangesAsync();
            await _orderRepository.SaveChangesAsync();

            var created = await LoadOrderAsync(order.Id);
            return (true, "Order created successfully.", created == null ? null : MapToDto(created));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to create order: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> UpdateOrderStatusAsync(int orderId, string newStatus, int adminId)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                return (false, "Order not found.");

            if (!StatusMapping.TryGetValue(newStatus.ToLower(), out var statusId))
                return (false, "Invalid status.");

            order.OrderStatusId = statusId;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            await _orderRepository.SaveChangesAsync();

            return (true, "Order status updated successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update order status: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> CancelOrderAsync(int orderId, int customerId)
    {
        try
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                return (false, "Order not found.");

            if (order.CustomerId != customerId)
                return (false, "Unauthorized to cancel this order.");

            if (order.OrderStatusId >= 3)
                return (false, "Order cannot be cancelled in current status.");

            order.OrderStatusId = 5;
            order.UpdatedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            await _orderRepository.SaveChangesAsync();

            return (true, "Order cancelled successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to cancel order: {ex.Message}");
        }
    }

    public async Task<IEnumerable<CustomerOrderDto>> GetOrdersByStatusAsync(string status)
    {
        if (!StatusMapping.TryGetValue(status.ToLower(), out var statusId))
            return new List<CustomerOrderDto>();

        var orders = await _context.CustomerOrders
            .Include(o => o.CustomerOrderItems)
                .ThenInclude(i => i.VendorCatalogProduct)
                    .ThenInclude(v => v!.CraftsmanProduct)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentMethod)
            .Where(o => o.OrderStatusId == statusId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<IEnumerable<BulkOrderDto>> GetBulkOrdersForSellerAsync(int sellerId)
    {
        var orders = await _bulkOrderRepository.FindAsync(bo => bo.CraftsmanId == sellerId);
        return orders.Select(MapBulkOrderToDto).ToList();
    }

    public async Task<IEnumerable<BulkOrderDto>> GetBulkOrdersForBuyerAsync(int buyerId)
    {
        var orders = await _bulkOrderRepository.FindAsync(bo => bo.VendorId == buyerId);
        return orders.Select(MapBulkOrderToDto).ToList();
    }

    public async Task<(bool Success, string Message, BulkOrderDto? BulkOrder)> CreateBulkOrderAsync(
        int vendorId, int craftsmanId, int productId, int quantity, decimal unitPrice, string specialRequirements)
    {
        try
        {
            var bulkOrder = new BulkOrder
            {
                VendorId = vendorId,
                CraftsmanId = craftsmanId,
                OrderNumber = Guid.NewGuid().ToString().Substring(0, 12),
                TotalQuantity = quantity,
                TotalCost = quantity * unitPrice,
                BulkOrderStatusId = 1,
                Notes = specialRequirements,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _bulkOrderRepository.AddAsync(bulkOrder);
            await _bulkOrderRepository.SaveChangesAsync();

            var bulkOrderItem = new BulkOrderItem
            {
                BulkOrderId = bulkOrder.Id,
                CraftsmanProductId = productId,
                Quantity = quantity,
                UnitCost = unitPrice,
                Subtotal = quantity * unitPrice,
                CreatedAt = DateTime.UtcNow
            };

            await _bulkOrderItemRepository.AddAsync(bulkOrderItem);
            await _bulkOrderItemRepository.SaveChangesAsync();

            return (true, "Bulk order created successfully.", MapBulkOrderToDto(bulkOrder));
        }
        catch (Exception ex)
        {
            return (false, $"Failed to create bulk order: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> UpdateBulkOrderStatusAsync(int bulkOrderId, string newStatus)
    {
        try
        {
            var bulkOrder = await _bulkOrderRepository.GetByIdAsync(bulkOrderId);
            if (bulkOrder == null)
                return (false, "Bulk order not found.");

            var statusMapping = new Dictionary<string, int>
            {
                { "pending", 1 },
                { "accepted", 2 },
                { "processing", 3 },
                { "completed", 4 },
                { "rejected", 5 }
            };

            if (!statusMapping.TryGetValue(newStatus.ToLower(), out var statusId))
                return (false, "Invalid status.");

            bulkOrder.BulkOrderStatusId = statusId;
            bulkOrder.UpdatedAt = DateTime.UtcNow;

            await _bulkOrderRepository.UpdateAsync(bulkOrder);
            await _bulkOrderRepository.SaveChangesAsync();

            return (true, "Bulk order status updated successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update bulk order status: {ex.Message}");
        }
    }

    private async Task<CustomerOrder?> LoadOrderAsync(int orderId) =>
        await _context.CustomerOrders
            .Include(o => o.CustomerOrderItems)
                .ThenInclude(i => i.VendorCatalogProduct)
                    .ThenInclude(v => v!.CraftsmanProduct)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentMethod)
            .FirstOrDefaultAsync(o => o.Id == orderId);

    private static readonly Dictionary<string, int> StatusMapping = new()
    {
        { "pending", 1 },
        { "processing", 2 },
        { "shipped", 3 },
        { "delivered", 4 },
        { "cancelled", 5 }
    };

    private static CustomerOrderDto MapToDto(CustomerOrder order)
    {
        var items = order.CustomerOrderItems.Select(i =>
        {
            var craftsman = i.VendorCatalogProduct?.CraftsmanProduct;
            return new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.VendorCatalogProductId,
                ProductName = craftsman?.ProductName ?? "Unknown",
                Price = i.UnitPrice,
                Quantity = i.Quantity,
                TotalPrice = i.Subtotal
            };
        }).ToList();

        PaymentInfoDto? payment = null;
        if (order.Payment != null)
        {
            payment = new PaymentInfoDto
            {
                Id = order.Payment.Id,
                PaymentMethod = order.Payment.PaymentMethod?.Name ?? "Unknown",
                Status = GetPaymentStatusName(order.Payment.PaymentStatusId),
                Amount = order.Payment.Amount,
                PaymentDate = order.Payment.CreatedAt,
                TransactionId = order.Payment.TransactionId
            };
        }

        return new CustomerOrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerId = order.CustomerId,
            OrderDate = order.CreatedAt,
            DeliveryDate = order.UpdatedAt,
            DeliveryAddress = order.DeliveryAddress,
            DeliveryCity = order.DeliveryCity,
            DeliveryState = order.DeliveryState,
            DeliveryPostalCode = order.DeliveryPostalCode,
            DeliveryCountry = order.DeliveryCountry,
            Status = GetStatusName(order.OrderStatusId),
            TotalAmount = order.TotalAmount,
            Notes = order.Notes,
            Items = items,
            Payment = payment
        };
    }

    private static BulkOrderDto MapBulkOrderToDto(BulkOrder bulkOrder) =>
        new()
        {
            Id = bulkOrder.Id,
            BuyerId = bulkOrder.VendorId,
            SellerId = bulkOrder.CraftsmanId,
            ProductId = 0,
            ProductName = "Product",
            Quantity = bulkOrder.TotalQuantity,
            UnitPrice = bulkOrder.TotalCost / (bulkOrder.TotalQuantity > 0 ? bulkOrder.TotalQuantity : 1),
            TotalAmount = bulkOrder.TotalCost,
            Status = GetBulkOrderStatusName(bulkOrder.BulkOrderStatusId),
            SpecialRequirements = bulkOrder.Notes,
            CreatedAt = bulkOrder.CreatedAt
        };

    private static string GetStatusName(int statusId) => statusId switch
    {
        1 => "Pending",
        2 => "Processing",
        3 => "Shipped",
        4 => "Delivered",
        5 => "Cancelled",
        _ => "Unknown"
    };

    private static string GetPaymentStatusName(int statusId) => statusId switch
    {
        1 => "Pending",
        2 => "Completed",
        3 => "Failed",
        4 => "Refunded",
        _ => "Unknown"
    };

    private static string GetBulkOrderStatusName(int statusId) => statusId switch
    {
        1 => "Pending",
        2 => "Accepted",
        3 => "Processing",
        4 => "Completed",
        5 => "Rejected",
        _ => "Unknown"
    };
}

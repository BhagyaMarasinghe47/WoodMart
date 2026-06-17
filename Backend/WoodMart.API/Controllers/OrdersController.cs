using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.DTOs.Order;
using WoodMart.Application.Interfaces;

namespace WoodMart.API.Controllers;

/// <summary>
/// Order management endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's orders.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CustomerOrderDto>>> GetUserOrders()
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var orders = await _orderService.GetCustomerOrdersAsync(customerId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user orders");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get order by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CustomerOrderDto>> GetOrderById(int id)
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var order = await _orderService.GetOrderForCustomerAsync(id, customerId);
            if (order == null)
                return NotFound(new { message = "Order not found" });

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching order {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get orders by status.
    /// </summary>
    [HttpGet("status/{status}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CustomerOrderDto>>> GetOrdersByStatus(string status)
    {
        try
        {
            var orders = await _orderService.GetOrdersByStatusAsync(status);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching orders by status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Place an order from the current shopping cart.
    /// </summary>
    [HttpPost("from-cart")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomerOrderDto>> CreateOrderFromCart([FromBody] CreateOrderFromCartDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, order) = await _orderService.CreateOrderFromCartAsync(customerId, request);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetOrderById), new { id = order?.Id }, order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order from cart");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new order.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CustomerOrderDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, order) = await _orderService.CreateOrderAsync(customerId, request);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetOrderById), new { id = order?.Id }, order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update order status.
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] dynamic request)
    {
        try
        {
            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (adminId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            string status = request?.status;
            if (string.IsNullOrWhiteSpace(status))
                return BadRequest(new { message = "Status is required" });

            var (success, message) = await _orderService.UpdateOrderStatusAsync(id, status, adminId);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Order status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cancel an order.
    /// </summary>
    [HttpDelete("{id}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CancelOrder(int id)
    {
        try
        {
            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message) = await _orderService.CancelOrderAsync(id, customerId);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Order cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling order");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get bulk orders for seller.
    /// </summary>
    [HttpGet("bulk/seller/{sellerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BulkOrderDto>>> GetBulkOrdersForSeller(int sellerId)
    {
        try
        {
            var orders = await _orderService.GetBulkOrdersForSellerAsync(sellerId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching bulk orders for seller");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get bulk orders for buyer.
    /// </summary>
    [HttpGet("bulk/buyer/{buyerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BulkOrderDto>>> GetBulkOrdersForBuyer(int buyerId)
    {
        try
        {
            var orders = await _orderService.GetBulkOrdersForBuyerAsync(buyerId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching bulk orders for buyer");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a bulk order.
    /// </summary>
    [HttpPost("bulk")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BulkOrderDto>> CreateBulkOrder([FromBody] dynamic request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            int vendorId = request?.vendorId;
            int craftsmanId = request?.craftsmanId;
            int productId = request?.productId;
            int quantity = request?.quantity;
            decimal unitPrice = request?.unitPrice;
            string specialRequirements = request?.specialRequirements ?? "";

            var (success, message, bulkOrder) = await _orderService.CreateBulkOrderAsync(vendorId, craftsmanId, productId, quantity, unitPrice, specialRequirements);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetBulkOrdersForSeller), new { sellerId = craftsmanId }, bulkOrder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating bulk order");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update bulk order status.
    /// </summary>
    [HttpPut("bulk/{id}/status")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateBulkOrderStatus(int id, [FromBody] dynamic request)
    {
        try
        {
            string newStatus = request?.status;
            if (string.IsNullOrWhiteSpace(newStatus))
                return BadRequest(new { message = "Status is required" });

            var (success, message) = await _orderService.UpdateBulkOrderStatusAsync(id, newStatus);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Bulk order status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating bulk order status");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}

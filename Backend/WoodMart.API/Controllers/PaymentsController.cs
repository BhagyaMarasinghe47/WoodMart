using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.DTOs.Payment;
using WoodMart.Application.Interfaces;

namespace WoodMart.API.Controllers;

/// <summary>
/// Payment processing endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Get all available payment methods.
    /// </summary>
    [HttpGet("methods")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PaymentMethodDto>>> GetPaymentMethods()
    {
        try
        {
            var methods = await _paymentService.GetPaymentMethodsAsync();
            return Ok(methods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment methods");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get payment by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PaymentDto>> GetPaymentById(int id)
    {
        try
        {
            var payment = await _paymentService.GetPaymentByIdAsync(id);
            if (payment == null)
                return NotFound(new { message = "Payment not found" });

            return Ok(payment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get payments by order.
    /// </summary>
    [HttpGet("order/{orderId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPaymentsByOrder(int orderId)
    {
        try
        {
            var payments = await _paymentService.GetPaymentsByOrderAsync(orderId);
            return Ok(payments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payments for order {OrderId}", orderId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get payments by customer.
    /// </summary>
    [HttpGet("customer/{customerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPaymentsByCustomer(int customerId)
    {
        try
        {
            var payments = await _paymentService.GetPaymentsByCustomerAsync(customerId);
            return Ok(payments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payments for customer {CustomerId}", customerId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Process a payment.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaymentResponseDto>> ProcessPayment([FromBody] ProcessPaymentDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var customerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (customerId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message, response) = await _paymentService.ProcessPaymentAsync(customerId, request);
            if (!success)
                return BadRequest(new { message });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Verify payment status.
    /// </summary>
    [HttpGet("verify/{transactionId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyPayment(string transactionId)
    {
        try
        {
            var (success, status) = await _paymentService.VerifyPaymentAsync(transactionId);
            if (!success)
                return NotFound(new { message = "Transaction not found" });

            return Ok(new { status, transactionId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Refund a payment (admin only).
    /// </summary>
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RefundPayment(int id)
    {
        try
        {
            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (adminId == 0)
                return Unauthorized(new { message = "User not authenticated" });

            var (success, message) = await _paymentService.RefundPaymentAsync(id, adminId);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message = "Payment refunded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refunding payment");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get payment statistics for a date range.
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentStats([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        try
        {
            var (totalAmount, transactionCount) = await _paymentService.GetPaymentStatsAsync(startDate, endDate);
            return Ok(new { totalAmount, transactionCount, startDate, endDate });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment stats");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}

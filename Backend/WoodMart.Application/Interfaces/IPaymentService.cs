using WoodMart.Application.DTOs.Payment;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Service interface for payment processing operations.
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Get all available payment methods.
    /// </summary>
    Task<IEnumerable<PaymentMethodDto>> GetPaymentMethodsAsync();

    /// <summary>
    /// Get a specific payment by ID.
    /// </summary>
    Task<PaymentDto?> GetPaymentByIdAsync(int paymentId);

    /// <summary>
    /// Get all payments for an order.
    /// </summary>
    Task<IEnumerable<PaymentDto>> GetPaymentsByOrderAsync(int orderId);

    /// <summary>
    /// Get all payments for a customer.
    /// </summary>
    Task<IEnumerable<PaymentDto>> GetPaymentsByCustomerAsync(int customerId);

    /// <summary>
    /// Process a payment for an order.
    /// </summary>
    Task<(bool Success, string Message, PaymentResponseDto? Response)> ProcessPaymentAsync(int customerId, ProcessPaymentDto request);

    /// <summary>
    /// Verify payment status with payment gateway.
    /// </summary>
    Task<(bool Success, string Status)> VerifyPaymentAsync(string transactionId);

    /// <summary>
    /// Refund a completed payment.
    /// </summary>
    Task<(bool Success, string Message)> RefundPaymentAsync(int paymentId, int adminId);

    /// <summary>
    /// Get payment statistics for a period.
    /// </summary>
    Task<(decimal TotalAmount, int TransactionCount)> GetPaymentStatsAsync(DateTime startDate, DateTime endDate);
}

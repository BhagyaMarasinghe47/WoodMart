namespace WoodMart.Application.DTOs.Payment;

/// <summary>
/// DTO for payment information.
/// </summary>
public class PaymentDto
{
    /// <summary>
    /// Payment ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Order ID associated with this payment.
    /// </summary>
    public int OrderId { get; set; }

    /// <summary>
    /// Payment amount.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Payment method ID.
    /// </summary>
    public int PaymentMethodId { get; set; }

    /// <summary>
    /// Payment method name (e.g., Credit Card, Bank Transfer).
    /// </summary>
    public required string PaymentMethodName { get; set; }

    /// <summary>
    /// Payment status ID.
    /// </summary>
    public int PaymentStatusId { get; set; }

    /// <summary>
    /// Payment status name (Pending, Completed, Failed, etc.).
    /// </summary>
    public required string PaymentStatusName { get; set; }

    /// <summary>
    /// Transaction ID from payment gateway.
    /// </summary>
    public required string TransactionId { get; set; }

    /// <summary>
    /// Payment reference code.
    /// </summary>
    public required string PaymentReference { get; set; }

    /// <summary>
    /// Additional notes about the payment.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Payment creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Payment last update timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for processing a payment.
/// </summary>
public class ProcessPaymentDto
{
    /// <summary>
    /// Order ID to pay for.
    /// </summary>
    public int OrderId { get; set; }

    /// <summary>
    /// Payment method ID.
    /// </summary>
    public int PaymentMethodId { get; set; }

    /// <summary>
    /// Payment amount.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Payment reference (transaction ID from payment provider).
    /// </summary>
    public required string PaymentReference { get; set; }

    /// <summary>
    /// Optional notes about the payment.
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for payment response from payment gateway.
/// </summary>
public class PaymentResponseDto
{
    /// <summary>
    /// Whether payment was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Response message.
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Payment ID (if successful).
    /// </summary>
    public int? PaymentId { get; set; }

    /// <summary>
    /// Transaction ID from payment gateway.
    /// </summary>
    public string? TransactionId { get; set; }

    /// <summary>
    /// Payment status.
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Redirect URL for payment (if needed).
    /// </summary>
    public string? RedirectUrl { get; set; }

    /// <summary>
    /// Error code (if failed).
    /// </summary>
    public string? ErrorCode { get; set; }
}

/// <summary>
/// DTO for payment method information.
/// </summary>
public class PaymentMethodDto
{
    /// <summary>
    /// Payment method ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Payment method name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Payment method description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether this payment method is active.
    /// </summary>
    public bool IsActive { get; set; }
}

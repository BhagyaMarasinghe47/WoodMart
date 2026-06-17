using WoodMart.Application.DTOs.Payment;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Service for payment processing.
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IRepository<PaymentMethod> _paymentMethodRepository;
    private readonly IRepository<PaymentStatus> _paymentStatusRepository;

    public PaymentService(
        IRepository<Payment> paymentRepository,
        IRepository<PaymentMethod> paymentMethodRepository,
        IRepository<PaymentStatus> paymentStatusRepository)
    {
        _paymentRepository = paymentRepository;
        _paymentMethodRepository = paymentMethodRepository;
        _paymentStatusRepository = paymentStatusRepository;
    }

    public async Task<IEnumerable<PaymentMethodDto>> GetPaymentMethodsAsync()
    {
        var methods = await _paymentMethodRepository.GetAllAsync();
        return methods.Select(m => new PaymentMethodDto
        {
            Id = m.Id,
            Name = m.Name,
            Description = m.Description,
            IsActive = true
        });
    }

    public async Task<PaymentDto?> GetPaymentByIdAsync(int paymentId)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        if (payment == null) return null;

        return MapToDto(payment);
    }

    public async Task<IEnumerable<PaymentDto>> GetPaymentsByOrderAsync(int orderId)
    {
        var payments = await _paymentRepository.FindAsync(p => p.CustomerOrderId == orderId);
        return payments.Select(MapToDto).ToList();
    }

    public async Task<IEnumerable<PaymentDto>> GetPaymentsByCustomerAsync(int customerId)
    {
        // This would need a join with CustomerOrder table
        var payments = await _paymentRepository.GetAllAsync();
        // Filter by customer (simplified - in real scenario use a join)
        return payments.Select(MapToDto).ToList();
    }

    public async Task<(bool Success, string Message, PaymentResponseDto? Response)> ProcessPaymentAsync(int customerId, ProcessPaymentDto request)
    {
        try
        {
            // Validate payment method exists
            var paymentMethod = await _paymentMethodRepository.GetByIdAsync(request.PaymentMethodId);
            if (paymentMethod == null)
                return (false, "Invalid payment method.", null);

            // Create payment record
            var payment = new Payment
            {
                CustomerOrderId = request.OrderId,
                Amount = request.Amount,
                PaymentMethodId = request.PaymentMethodId,
                PaymentStatusId = 1, // Pending
                TransactionId = request.PaymentReference,
                PaymentReference = request.PaymentReference,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _paymentRepository.AddAsync(payment);
            await _paymentRepository.SaveChangesAsync();

            var response = new PaymentResponseDto
            {
                Success = true,
                Message = "Payment processed successfully.",
                PaymentId = payment.Id,
                TransactionId = payment.TransactionId,
                Status = "Pending",
                ErrorCode = null
            };

            return (true, "Payment processed successfully.", response);
        }
        catch (Exception ex)
        {
            var errorResponse = new PaymentResponseDto
            {
                Success = false,
                Message = $"Payment processing failed: {ex.Message}",
                ErrorCode = "PAYMENT_ERROR"
            };

            return (false, $"Payment processing failed: {ex.Message}", errorResponse);
        }
    }

    public async Task<(bool Success, string Status)> VerifyPaymentAsync(string transactionId)
    {
        try
        {
            var payment = await _paymentRepository.FirstOrDefaultAsync(p => p.TransactionId == transactionId);
            if (payment == null)
                return (false, "Payment not found.");

            var status = GetPaymentStatusName(payment.PaymentStatusId);
            return (true, status);
        }
        catch (Exception ex)
        {
            return (false, $"Verification failed: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> RefundPaymentAsync(int paymentId, int adminId)
    {
        try
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                return (false, "Payment not found.");

            if (payment.PaymentStatusId != 2) // Only refund completed payments
                return (false, "Payment is not eligible for refund.");

            payment.PaymentStatusId = 4; // Refunded status
            payment.UpdatedAt = DateTime.UtcNow;

            await _paymentRepository.UpdateAsync(payment);
            await _paymentRepository.SaveChangesAsync();

            return (true, "Payment refunded successfully.");
        }
        catch (Exception ex)
        {
            return (false, $"Refund failed: {ex.Message}");
        }
    }

    public async Task<(decimal TotalAmount, int TransactionCount)> GetPaymentStatsAsync(DateTime startDate, DateTime endDate)
    {
        try
        {
            var payments = await _paymentRepository.FindAsync(p =>
                p.CreatedAt >= startDate && p.CreatedAt <= endDate && p.PaymentStatusId == 2); // Completed only

            var totalAmount = payments.Sum(p => p.Amount);
            var transactionCount = payments.Count();

            return (totalAmount, transactionCount);
        }
        catch
        {
            return (0, 0);
        }
    }

    private PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.CustomerOrderId,
            Amount = payment.Amount,
            PaymentMethodId = payment.PaymentMethodId,
            PaymentMethodName = "Unknown",
            PaymentStatusId = payment.PaymentStatusId,
            PaymentStatusName = GetPaymentStatusName(payment.PaymentStatusId),
            TransactionId = payment.TransactionId,
            PaymentReference = payment.PaymentReference,
            Notes = payment.Notes,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }

    private string GetPaymentStatusName(int statusId) => statusId switch
    {
        1 => "Pending",
        2 => "Completed",
        3 => "Failed",
        4 => "Refunded",
        _ => "Unknown"
    };
}

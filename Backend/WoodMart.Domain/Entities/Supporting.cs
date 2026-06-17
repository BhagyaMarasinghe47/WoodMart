namespace WoodMart.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public int CustomerOrderId { get; set; }
    public decimal Amount { get; set; }
    public int PaymentMethodId { get; set; }
    public int PaymentStatusId { get; set; }
    public string TransactionId { get; set; }
    public string PaymentReference { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual CustomerOrder CustomerOrder { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
    public virtual PaymentStatus PaymentStatus { get; set; }
}

public class Review
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int VendorCatalogProductId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User Customer { get; set; }
    public virtual VendorCatalogProduct VendorCatalogProduct { get; set; }
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
}

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; }
    public string TableName { get; set; }
    public int? RecordId { get; set; }
    public string OldValues { get; set; }
    public string NewValues { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; }
}

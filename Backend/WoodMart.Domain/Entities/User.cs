namespace WoodMart.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? ProfileImageUrl { get; set; }
    public int RoleId { get; set; }
    public int UserStatusId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual Role Role { get; set; }
    public virtual UserStatus UserStatus { get; set; }
    public virtual User ApprovedByUser { get; set; }
    public virtual ICollection<User> ApprovedUsers { get; set; } = new List<User>();
    public virtual ShoppingCart ShoppingCart { get; set; }
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<CraftsmanProduct> CraftsmanProducts { get; set; } = new List<CraftsmanProduct>();
    public virtual ICollection<VendorCatalogProduct> VendorCatalogProducts { get; set; } = new List<VendorCatalogProduct>();
    public virtual ICollection<CustomerOrder> CustomerOrders { get; set; } = new List<CustomerOrder>();
    public virtual ICollection<BulkOrder> VendorBulkOrders { get; set; } = new List<BulkOrder>();
    public virtual ICollection<BulkOrder> CraftsmanBulkOrders { get; set; } = new List<BulkOrder>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public virtual ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();

    public string FullName => $"{FirstName} {LastName}";
}

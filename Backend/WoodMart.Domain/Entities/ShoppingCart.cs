namespace WoodMart.Domain.Entities;

public class WishlistItem
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int VendorCatalogProductId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public virtual User Customer { get; set; }
    public virtual VendorCatalogProduct VendorCatalogProduct { get; set; }
}

public class ShoppingCart
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User Customer { get; set; }
    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}

public class CartItem
{
    public int Id { get; set; }
    public int ShoppingCartId { get; set; }
    public int VendorCatalogProductId { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ShoppingCart ShoppingCart { get; set; }
    public virtual VendorCatalogProduct VendorCatalogProduct { get; set; }
}

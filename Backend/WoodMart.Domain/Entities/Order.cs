namespace WoodMart.Domain.Entities;

public class CustomerOrder
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string OrderNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public int OrderStatusId { get; set; }
    public string DeliveryAddress { get; set; }
    public string DeliveryCity { get; set; }
    public string DeliveryState { get; set; }
    public string DeliveryPostalCode { get; set; }
    public string DeliveryCountry { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User Customer { get; set; }
    public virtual OrderStatus OrderStatus { get; set; }
    public virtual ICollection<CustomerOrderItem> CustomerOrderItems { get; set; } = new List<CustomerOrderItem>();
    public virtual Payment Payment { get; set; }
}

public class CustomerOrderItem
{
    public int Id { get; set; }
    public int CustomerOrderId { get; set; }
    public int VendorCatalogProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual CustomerOrder CustomerOrder { get; set; }
    public virtual VendorCatalogProduct VendorCatalogProduct { get; set; }
}

public class BulkOrder
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public int CraftsmanId { get; set; }
    public string OrderNumber { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalCost { get; set; }
    public int BulkOrderStatusId { get; set; }
    public string Notes { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User Vendor { get; set; }
    public virtual User Craftsman { get; set; }
    public virtual BulkOrderStatus BulkOrderStatus { get; set; }
    public virtual ICollection<BulkOrderItem> BulkOrderItems { get; set; } = new List<BulkOrderItem>();
}

public class BulkOrderItem
{
    public int Id { get; set; }
    public int BulkOrderId { get; set; }
    public int CraftsmanProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal Subtotal { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual BulkOrder BulkOrder { get; set; }
    public virtual CraftsmanProduct CraftsmanProduct { get; set; }
}

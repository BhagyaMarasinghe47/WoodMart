namespace WoodMart.Domain.Entities;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

public class UserStatus
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

public class OrderStatus
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual ICollection<CustomerOrder> CustomerOrders { get; set; } = new List<CustomerOrder>();
}

public class BulkOrderStatus
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual ICollection<BulkOrder> BulkOrders { get; set; } = new List<BulkOrder>();
}

public class PaymentStatus
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class PaymentMethod
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual ICollection<Subcategory> Subcategories { get; set; } = new List<Subcategory>();
    public virtual ICollection<CraftsmanProduct> CraftsmanProducts { get; set; } = new List<CraftsmanProduct>();
}

public class Subcategory
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public virtual Category Category { get; set; }
    public virtual ICollection<CraftsmanProduct> CraftsmanProducts { get; set; } = new List<CraftsmanProduct>();
}

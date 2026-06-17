using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using WoodMart.Domain.Entities;

namespace WoodMart.Infrastructure.Data;

public class WoodMartDbContext : DbContext
{
    public WoodMartDbContext(DbContextOptions<WoodMartDbContext> options) : base(options)
    {
    }

    // Lookup/Reference Tables
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserStatus> UserStatuses { get; set; }
    public DbSet<OrderStatus> OrderStatuses { get; set; }
    public DbSet<BulkOrderStatus> BulkOrderStatuses { get; set; }
    public DbSet<PaymentStatus> PaymentStatuses { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Subcategory> Subcategories { get; set; }

    // Core Tables
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    // Product Tables
    public DbSet<CraftsmanProduct> CraftsmanProducts { get; set; }
    public DbSet<VendorCatalogProduct> VendorCatalogProducts { get; set; }

    // Wishlist
    public DbSet<WishlistItem> WishlistItems { get; set; }

    // Shopping Cart Tables
    public DbSet<ShoppingCart> ShoppingCarts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }

    // Order Tables
    public DbSet<CustomerOrder> CustomerOrders { get; set; }
    public DbSet<CustomerOrderItem> CustomerOrderItems { get; set; }
    public DbSet<BulkOrder> BulkOrders { get; set; }
    public DbSet<BulkOrderItem> BulkOrderItems { get; set; }

    // Payment & Review Tables
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }

    // Audit Table
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureCatalogTables(modelBuilder);

        // Configure User relationships
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId);

        modelBuilder.Entity<User>()
            .HasOne(u => u.UserStatus)
            .WithMany(us => us.Users)
            .HasForeignKey(u => u.UserStatusId);

        modelBuilder.Entity<User>()
            .HasOne(u => u.ApprovedByUser)
            .WithMany(u => u.ApprovedUsers)
            .HasForeignKey(u => u.ApprovedBy)
            .IsRequired(false);

        modelBuilder.Entity<User>()
            .HasOne(u => u.ShoppingCart)
            .WithOne(sc => sc.Customer)
            .HasForeignKey<ShoppingCart>(sc => sc.CustomerId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Category relationships
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Subcategories)
            .WithOne(sc => sc.Category)
            .HasForeignKey(sc => sc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure CraftsmanProduct relationships
        modelBuilder.Entity<CraftsmanProduct>()
            .HasOne(cp => cp.Craftsman)
            .WithMany(u => u.CraftsmanProducts)
            .HasForeignKey(cp => cp.CraftsmanId);

        modelBuilder.Entity<CraftsmanProduct>()
            .HasOne(cp => cp.Category)
            .WithMany(c => c.CraftsmanProducts)
            .HasForeignKey(cp => cp.CategoryId);

        modelBuilder.Entity<CraftsmanProduct>()
            .HasOne(cp => cp.Subcategory)
            .WithMany(sc => sc.CraftsmanProducts)
            .HasForeignKey(cp => cp.SubcategoryId)
            .IsRequired(false);

        modelBuilder.Entity<CraftsmanProduct>()
            .HasMany(cp => cp.VendorCatalogProducts)
            .WithOne(vcp => vcp.CraftsmanProduct)
            .HasForeignKey(vcp => vcp.CraftsmanProductId);

        // Configure VendorCatalogProduct relationships
        modelBuilder.Entity<VendorCatalogProduct>()
            .HasOne(vcp => vcp.Vendor)
            .WithMany(u => u.VendorCatalogProducts)
            .HasForeignKey(vcp => vcp.VendorId);

        // Configure ShoppingCart relationships
        modelBuilder.Entity<ShoppingCart>()
            .HasMany(sc => sc.CartItems)
            .WithOne(ci => ci.ShoppingCart)
            .HasForeignKey(ci => ci.ShoppingCartId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CartItem>()
            .HasOne(ci => ci.VendorCatalogProduct)
            .WithMany(vcp => vcp.CartItems)
            .HasForeignKey(ci => ci.VendorCatalogProductId);

        // Configure CustomerOrder relationships
        modelBuilder.Entity<CustomerOrder>()
            .HasOne(co => co.Customer)
            .WithMany(u => u.CustomerOrders)
            .HasForeignKey(co => co.CustomerId);

        modelBuilder.Entity<CustomerOrder>()
            .HasOne(co => co.OrderStatus)
            .WithMany(os => os.CustomerOrders)
            .HasForeignKey(co => co.OrderStatusId);

        modelBuilder.Entity<CustomerOrder>()
            .HasMany(co => co.CustomerOrderItems)
            .WithOne(coi => coi.CustomerOrder)
            .HasForeignKey(coi => coi.CustomerOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CustomerOrder>()
            .HasOne(co => co.Payment)
            .WithOne(p => p.CustomerOrder)
            .HasForeignKey<Payment>(p => p.CustomerOrderId);

        // Configure CustomerOrderItem relationships
        modelBuilder.Entity<CustomerOrderItem>()
            .HasOne(coi => coi.VendorCatalogProduct)
            .WithMany(vcp => vcp.CustomerOrderItems)
            .HasForeignKey(coi => coi.VendorCatalogProductId);

        // Configure BulkOrder relationships
        modelBuilder.Entity<BulkOrder>()
            .HasOne(bo => bo.Vendor)
            .WithMany(u => u.VendorBulkOrders)
            .HasForeignKey(bo => bo.VendorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BulkOrder>()
            .HasOne(bo => bo.Craftsman)
            .WithMany(u => u.CraftsmanBulkOrders)
            .HasForeignKey(bo => bo.CraftsmanId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BulkOrder>()
            .HasOne(bo => bo.BulkOrderStatus)
            .WithMany(bos => bos.BulkOrders)
            .HasForeignKey(bo => bo.BulkOrderStatusId);

        modelBuilder.Entity<BulkOrder>()
            .HasMany(bo => bo.BulkOrderItems)
            .WithOne(boi => boi.BulkOrder)
            .HasForeignKey(boi => boi.BulkOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure BulkOrderItem relationships
        modelBuilder.Entity<BulkOrderItem>()
            .HasOne(boi => boi.CraftsmanProduct)
            .WithMany(cp => cp.BulkOrderItems)
            .HasForeignKey(boi => boi.CraftsmanProductId);

        // Configure Payment relationships
        modelBuilder.Entity<Payment>()
            .HasOne(p => p.PaymentMethod)
            .WithMany(pm => pm.Payments)
            .HasForeignKey(p => p.PaymentMethodId);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.PaymentStatus)
            .WithMany(ps => ps.Payments)
            .HasForeignKey(p => p.PaymentStatusId);

        // Configure WishlistItem relationships
        modelBuilder.Entity<WishlistItem>().ToTable("wishlist_items");
        ApplySnakeCaseColumns<WishlistItem>(modelBuilder);
        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.Customer)
            .WithMany(u => u.WishlistItems)
            .HasForeignKey(w => w.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.VendorCatalogProduct)
            .WithMany()
            .HasForeignKey(w => w.VendorCatalogProductId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WishlistItem>()
            .HasIndex(w => new { w.CustomerId, w.VendorCatalogProductId })
            .IsUnique();

        // Configure Review relationships
        modelBuilder.Entity<Review>()
            .HasOne(r => r.Customer)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.CustomerId);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.VendorCatalogProduct)
            .WithMany(vcp => vcp.Reviews)
            .HasForeignKey(r => r.VendorCatalogProductId);

        // Configure AuditLog relationships
        modelBuilder.Entity<AuditLog>()
            .HasOne(al => al.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(al => al.UserId)
            .IsRequired(false);

        // Configure Unique Constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<CustomerOrder>()
            .HasIndex(co => co.OrderNumber)
            .IsUnique();

        modelBuilder.Entity<BulkOrder>()
            .HasIndex(bo => bo.OrderNumber)
            .IsUnique();

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.TransactionId)
            .IsUnique();

        modelBuilder.Entity<CartItem>()
            .HasIndex(ci => new { ci.ShoppingCartId, ci.VendorCatalogProductId })
            .IsUnique();

        modelBuilder.Entity<VendorCatalogProduct>()
            .HasIndex(vcp => new { vcp.CraftsmanProductId, vcp.VendorId })
            .IsUnique();

        modelBuilder.Entity<Subcategory>()
            .HasIndex(sc => new { sc.CategoryId, sc.Name })
            .IsUnique();
    }

    private static void ConfigureCatalogTables(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>().ToTable("categories");
        modelBuilder.Entity<Subcategory>().ToTable("subcategories");
        modelBuilder.Entity<CraftsmanProduct>().ToTable("craftsman_products");
        modelBuilder.Entity<VendorCatalogProduct>().ToTable("vendor_catalog_products");
        modelBuilder.Entity<ShoppingCart>().ToTable("shopping_carts");
        modelBuilder.Entity<CartItem>().ToTable("cart_items");
        modelBuilder.Entity<CustomerOrder>().ToTable("customer_orders");
        modelBuilder.Entity<CustomerOrderItem>().ToTable("customer_order_items");
        modelBuilder.Entity<Payment>().ToTable("payments");
        modelBuilder.Entity<BulkOrder>().ToTable("BulkOrders");
        modelBuilder.Entity<BulkOrderItem>().ToTable("BulkOrderItems");

        ApplySnakeCaseColumns<BulkOrder>(modelBuilder);
        ApplySnakeCaseColumns<BulkOrderItem>(modelBuilder);
        ApplySnakeCaseColumns<Category>(modelBuilder);
        ApplySnakeCaseColumns<ShoppingCart>(modelBuilder);
        ApplySnakeCaseColumns<CartItem>(modelBuilder);
        ApplySnakeCaseColumns<CustomerOrder>(modelBuilder);
        ApplySnakeCaseColumns<CustomerOrderItem>(modelBuilder);
        ApplySnakeCaseColumns<Payment>(modelBuilder);
        ApplySnakeCaseColumns<Subcategory>(modelBuilder);

        var craftsman = modelBuilder.Entity<CraftsmanProduct>();
        ApplySnakeCaseColumns<CraftsmanProduct>(modelBuilder);
        craftsman.Property(p => p.ProductName).HasColumnName("product_name");
        craftsman.Property(p => p.WholesalePrice).HasColumnName("wholesale_price");
        craftsman.Property(p => p.TotalStock).HasColumnName("total_stock");

        var vendorCatalog = modelBuilder.Entity<VendorCatalogProduct>();
        ApplySnakeCaseColumns<VendorCatalogProduct>(modelBuilder);
        vendorCatalog.Property(p => p.RetailPrice).HasColumnName("retail_price");
        vendorCatalog.Property(p => p.AvailableStock).HasColumnName("available_stock");
        vendorCatalog.Property(p => p.IsPublished).HasColumnName("is_published");
    }

    private static void ApplySnakeCaseColumns<TEntity>(ModelBuilder modelBuilder) where TEntity : class
    {
        var entity = modelBuilder.Entity<TEntity>();
        foreach (var property in entity.Metadata.GetProperties())
        {
            if (property.GetColumnName() == null || property.GetColumnName() == property.Name)
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name))
            return name;

        var builder = new StringBuilder();
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c))
            {
                if (i > 0)
                    builder.Append('_');
                builder.Append(char.ToLowerInvariant(c));
            }
            else
            {
                builder.Append(c);
            }
        }

        return builder.ToString();
    }
}

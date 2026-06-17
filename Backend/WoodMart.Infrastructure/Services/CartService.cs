using Microsoft.EntityFrameworkCore;
using WoodMart.Application.DTOs.Cart;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Service for shopping cart management.
/// </summary>
public class CartService : ICartService
{
    private readonly WoodMartDbContext _context;
    private readonly IRepository<ShoppingCart> _cartRepository;
    private readonly IRepository<CartItem> _cartItemRepository;

    public CartService(
        WoodMartDbContext context,
        IRepository<ShoppingCart> cartRepository,
        IRepository<CartItem> cartItemRepository)
    {
        _context = context;
        _cartRepository = cartRepository;
        _cartItemRepository = cartItemRepository;
    }

    public async Task<ShoppingCartDto?> GetCartByCustomerIdAsync(int customerId)
    {
        var cart = await _context.ShoppingCarts
            .Include(sc => sc.CartItems)
                .ThenInclude(ci => ci.VendorCatalogProduct)
                    .ThenInclude(v => v!.CraftsmanProduct)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId);

        if (cart == null)
            return null;

        return MapToDto(cart);
    }

    public async Task<(bool Success, string Message, ShoppingCartDto? Cart)> AddToCartAsync(int customerId, int productId, int quantity)
    {
        try
        {
            if (quantity <= 0)
                return (false, "Quantity must be at least 1.", null);

            var vendorProduct = await GetPublishedVendorProductAsync(productId);
            if (vendorProduct == null)
                return (false, "Product not found or is not available.", null);

            var cart = await _cartRepository.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (cart == null)
            {
                cart = new ShoppingCart { CustomerId = customerId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                await _cartRepository.AddAsync(cart);
                await _cartRepository.SaveChangesAsync();
            }

            var existingItem = await _cartItemRepository.FirstOrDefaultAsync(
                ci => ci.ShoppingCartId == cart.Id && ci.VendorCatalogProductId == productId);

            var newQuantity = (existingItem?.Quantity ?? 0) + quantity;
            if (newQuantity > vendorProduct.AvailableStock)
                return (false, $"Only {vendorProduct.AvailableStock} item(s) available in stock.", null);

            if (existingItem != null)
            {
                existingItem.Quantity = newQuantity;
                existingItem.UpdatedAt = DateTime.UtcNow;
                await _cartItemRepository.UpdateAsync(existingItem);
            }
            else
            {
                var cartItem = new CartItem
                {
                    ShoppingCartId = cart.Id,
                    VendorCatalogProductId = productId,
                    Quantity = quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _cartItemRepository.AddAsync(cartItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.UpdateAsync(cart);
            await _cartRepository.SaveChangesAsync();

            var updatedCart = await GetCartByCustomerIdAsync(customerId);
            return (true, "Item added to cart.", updatedCart);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to add item to cart: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, ShoppingCartDto? Cart)> RemoveFromCartAsync(int customerId, int cartItemId)
    {
        try
        {
            var cart = await _cartRepository.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (cart == null)
                return (false, "Cart not found.", null);

            var cartItem = await _cartItemRepository.GetByIdAsync(cartItemId);
            if (cartItem == null || cartItem.ShoppingCartId != cart.Id)
                return (false, "Cart item not found.", null);

            await _cartItemRepository.DeleteAsync(cartItem);
            await _cartItemRepository.SaveChangesAsync();

            cart.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.UpdateAsync(cart);
            await _cartRepository.SaveChangesAsync();

            var updatedCart = await GetCartByCustomerIdAsync(customerId);
            return (true, "Item removed from cart.", updatedCart);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to remove item: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, ShoppingCartDto? Cart)> UpdateCartItemQuantityAsync(int customerId, int cartItemId, int quantity)
    {
        try
        {
            if (quantity <= 0)
                return await RemoveFromCartAsync(customerId, cartItemId);

            var cart = await _cartRepository.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (cart == null)
                return (false, "Cart not found.", null);

            var cartItem = await _cartItemRepository.GetByIdAsync(cartItemId);
            if (cartItem == null || cartItem.ShoppingCartId != cart.Id)
                return (false, "Cart item not found.", null);

            var vendorProduct = await GetPublishedVendorProductAsync(cartItem.VendorCatalogProductId);
            if (vendorProduct == null)
                return (false, "Product is no longer available.", null);

            if (quantity > vendorProduct.AvailableStock)
                return (false, $"Only {vendorProduct.AvailableStock} item(s) available in stock.", null);

            cartItem.Quantity = quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _cartItemRepository.UpdateAsync(cartItem);
            await _cartItemRepository.SaveChangesAsync();

            cart.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.UpdateAsync(cart);
            await _cartRepository.SaveChangesAsync();

            var updatedCart = await GetCartByCustomerIdAsync(customerId);
            return (true, "Quantity updated.", updatedCart);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to update quantity: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message)> ClearCartAsync(int customerId)
    {
        try
        {
            var cart = await _cartRepository.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (cart == null)
                return (true, "Cart cleared.");

            var items = await _cartItemRepository.FindAsync(ci => ci.ShoppingCartId == cart.Id);
            foreach (var item in items)
            {
                await _cartItemRepository.DeleteAsync(item);
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.UpdateAsync(cart);
            await _cartItemRepository.SaveChangesAsync();
            await _cartRepository.SaveChangesAsync();
            return (true, "Cart cleared.");
        }
        catch (Exception ex)
        {
            return (false, $"Failed to clear cart: {ex.Message}");
        }
    }

    public async Task<decimal> GetCartTotalAsync(int customerId)
    {
        var cart = await GetCartByCustomerIdAsync(customerId);
        return cart?.Total ?? 0;
    }

    public async Task<bool> IsProductInCartAsync(int customerId, int productId)
    {
        var cart = await _cartRepository.FirstOrDefaultAsync(c => c.CustomerId == customerId);
        if (cart == null) return false;

        return await _cartItemRepository.ExistsAsync(
            ci => ci.ShoppingCartId == cart.Id && ci.VendorCatalogProductId == productId);
    }

    private async Task<VendorCatalogProduct?> GetPublishedVendorProductAsync(int productId) =>
        await _context.VendorCatalogProducts
            .Include(v => v.CraftsmanProduct)
            .FirstOrDefaultAsync(v => v.Id == productId && v.IsPublished);

    private static ShoppingCartDto MapToDto(ShoppingCart cart)
    {
        var cartItems = new List<CartItemDto>();
        decimal subtotal = 0;

        foreach (var item in cart.CartItems)
        {
            var product = item.VendorCatalogProduct;
            var craftsman = product?.CraftsmanProduct;
            var price = product?.RetailPrice ?? 0;
            var itemTotal = price * item.Quantity;
            subtotal += itemTotal;

            cartItems.Add(new CartItemDto
            {
                Id = item.Id,
                ProductId = item.VendorCatalogProductId,
                ProductName = craftsman?.ProductName ?? "Unknown",
                Price = price,
                Quantity = item.Quantity,
                TotalPrice = itemTotal,
                ProductImageUrl = craftsman?.ImageUrl,
                AvailableStock = product?.AvailableStock ?? 0,
                AddedAt = item.CreatedAt
            });
        }

        return new ShoppingCartDto
        {
            Id = cart.Id,
            CustomerId = cart.CustomerId,
            Items = cartItems,
            ItemCount = cartItems.Sum(ci => ci.Quantity),
            Subtotal = subtotal,
            Total = subtotal,
            UpdatedAt = cart.UpdatedAt
        };
    }
}

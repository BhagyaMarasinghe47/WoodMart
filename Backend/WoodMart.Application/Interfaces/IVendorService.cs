using WoodMart.Application.DTOs.Product;
using WoodMart.Application.DTOs.Vendor;

namespace WoodMart.Application.Interfaces;

public interface IVendorService
{
    Task<IEnumerable<VendorCatalogProductDto>> GetCatalogAsync(int vendorId);
    Task<IEnumerable<VendorCatalogProductDto>> GetPublishedProductsAsync(int vendorId);
    Task<IEnumerable<VendorShopDto>> GetShopsAsync();
    Task<VendorDashboardStatsDto> GetDashboardStatsAsync(int vendorId);
    Task<IEnumerable<VendorCustomerOrderDto>> GetCustomerOrdersAsync(int vendorId);
    Task<IEnumerable<CraftsmanListItemDto>> GetCraftsmenAsync();
    Task<IEnumerable<CraftsmanProductBrowseDto>> GetCraftsmanProductsBrowseAsync(int vendorId, int? craftsmanId = null);
    Task<(bool Success, string Message, VendorCatalogProductDto? Product)> AddToCatalogAsync(int vendorId, AddVendorCatalogItemDto request);
    Task<(bool Success, string Message, VendorCatalogProductDto? Product)> UpdateCatalogItemAsync(int vendorId, int catalogProductId, UpdateVendorCatalogItemDto request);
    Task<(bool Success, string Message, VendorCatalogProductDto? Product)> TogglePublishAsync(int vendorId, int catalogProductId);
    Task<(bool Success, string Message)> RemoveFromCatalogAsync(int vendorId, int catalogProductId);
    Task<(bool Success, string Message)> UpdateOrderStatusAsync(int vendorId, int orderId, string status);
}

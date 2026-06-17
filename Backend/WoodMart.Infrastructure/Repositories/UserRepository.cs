using Microsoft.EntityFrameworkCore;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Repositories;

/// <summary>
/// Specialized repository for User entity with custom query methods
/// </summary>
public class UserRepository : Repository<User>
{
    public UserRepository(WoodMartDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Get user by ID with role loaded
    /// </summary>
    public async Task<User?> GetByIdWithRoleAsync(int id)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    /// <summary>
    /// Get user by email
    /// </summary>
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    /// <summary>
    /// Get user by email with all related data
    /// </summary>
    public async Task<User?> GetByEmailWithAllIncludesAsync(string email)
    {
        return await _dbSet
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .Include(u => u.ShoppingCart)
            .Include(u => u.RefreshTokens)
            .Include(u => u.CraftsmanProducts)
            .Include(u => u.VendorCatalogProducts)
            .Include(u => u.CustomerOrders)
            .Include(u => u.VendorBulkOrders)
            .Include(u => u.CraftsmanBulkOrders)
            .Include(u => u.Reviews)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    /// <summary>
    /// Get users by role ID
    /// </summary>
    public async Task<IEnumerable<User>> GetByRoleAsync(int roleId)
    {
        return await _dbSet
            .Where(u => u.RoleId == roleId)
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .ToListAsync();
    }

    /// <summary>
    /// Get users by status ID
    /// </summary>
    public async Task<IEnumerable<User>> GetByStatusAsync(int statusId)
    {
        return await _dbSet
            .Where(u => u.UserStatusId == statusId)
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .ToListAsync();
    }

    /// <summary>
    /// Get pending approval users (for vendors and craftsmen)
    /// </summary>
    public async Task<IEnumerable<User>> GetPendingApprovalAsync()
    {
        const int pendingStatusId = 2;
        return await _dbSet
            .Where(u => u.UserStatusId == pendingStatusId)
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get active users with their full data
    /// </summary>
    public async Task<IEnumerable<User>> GetActiveUsersAsync()
    {
        const int activeStatusId = 1;
        return await _dbSet
            .Where(u => u.UserStatusId == activeStatusId)
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .ToListAsync();
    }

    /// <summary>
    /// Search users by first or last name
    /// </summary>
    public async Task<IEnumerable<User>> SearchByNameAsync(string searchTerm)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Where(u => u.FirstName.ToLower().Contains(term) || u.LastName.ToLower().Contains(term))
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .ToListAsync();
    }

    /// <summary>
    /// Get user with all related data for dashboard view
    /// </summary>
    public async Task<User?> GetForDashboardAsync(int userId)
    {
        return await _dbSet
            .Where(u => u.Id == userId)
            .Include(u => u.Role)
            .Include(u => u.UserStatus)
            .Include(u => u.ShoppingCart)
            .ThenInclude(sc => sc.CartItems)
            .ThenInclude(ci => ci.VendorCatalogProduct)
            .Include(u => u.CustomerOrders)
            .Include(u => u.VendorBulkOrders)
            .Include(u => u.CraftsmanBulkOrders)
            .Include(u => u.Reviews)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get total user count by role
    /// </summary>
    public async Task<Dictionary<string, int>> GetUserCountByRoleAsync()
    {
        return await _dbSet
            .GroupBy(u => u.Role!.Name)
            .Select(g => new { Role = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Role, x => x.Count);
    }
}

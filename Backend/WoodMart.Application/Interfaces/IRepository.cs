using System.Linq.Expressions;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Generic repository interface for CRUD operations and querying
/// </summary>
/// <typeparam name="T">Entity type</typeparam>
public interface IRepository<T> where T : class
{
    /// <summary>
    /// Get entity by ID
    /// </summary>
    Task<T?> GetByIdAsync(int id);

    /// <summary>
    /// Get all entities
    /// </summary>
    Task<IEnumerable<T>> GetAllAsync();

    /// <summary>
    /// Find entities matching predicate
    /// </summary>
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Get first entity matching predicate or null
    /// </summary>
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Check if entity exists
    /// </summary>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Count entities matching predicate
    /// </summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

    /// <summary>
    /// Add entity
    /// </summary>
    Task<T> AddAsync(T entity);

    /// <summary>
    /// Add multiple entities
    /// </summary>
    Task AddRangeAsync(IEnumerable<T> entities);

    /// <summary>
    /// Update entity
    /// </summary>
    Task<T> UpdateAsync(T entity);

    /// <summary>
    /// Update multiple entities
    /// </summary>
    Task UpdateRangeAsync(IEnumerable<T> entities);

    /// <summary>
    /// Delete entity by ID
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Delete entity
    /// </summary>
    Task<bool> DeleteAsync(T entity);

    /// <summary>
    /// Delete multiple entities
    /// </summary>
    Task<bool> DeleteRangeAsync(IEnumerable<T> entities);

    /// <summary>
    /// Save changes to database
    /// </summary>
    Task<int> SaveChangesAsync();

    /// <summary>
    /// Get queryable for advanced LINQ operations
    /// </summary>
    IQueryable<T> GetQueryable();

    /// <summary>
    /// Get with eager loading of related entities
    /// </summary>
    Task<T?> GetByIdWithIncludesAsync(int id, params Expression<Func<T, object>>[] includes);

    /// <summary>
    /// Find with eager loading of related entities
    /// </summary>
    Task<IEnumerable<T>> FindWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
}

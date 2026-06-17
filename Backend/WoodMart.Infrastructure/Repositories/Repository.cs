using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WoodMart.Application.Interfaces;
using WoodMart.Infrastructure.Data;

namespace WoodMart.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation with full CRUD and query operations
/// </summary>
/// <typeparam name="T">Entity type</typeparam>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly WoodMartDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(WoodMartDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    /// <summary>
    /// Get entity by ID
    /// </summary>
    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    /// <summary>
    /// Get all entities
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    /// <summary>
    /// Find entities matching predicate
    /// </summary>
    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    /// <summary>
    /// Get first entity matching predicate or null
    /// </summary>
    public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.FirstOrDefaultAsync(predicate);
    }

    /// <summary>
    /// Check if entity exists
    /// </summary>
    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    /// <summary>
    /// Count entities matching predicate
    /// </summary>
    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? await _dbSet.CountAsync()
            : await _dbSet.CountAsync(predicate);
    }

    /// <summary>
    /// Add entity
    /// </summary>
    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    /// <summary>
    /// Add multiple entities
    /// </summary>
    public virtual async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
    }

    /// <summary>
    /// Update entity
    /// </summary>
    public virtual async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return entity;
    }

    /// <summary>
    /// Update multiple entities
    /// </summary>
    public virtual async Task UpdateRangeAsync(IEnumerable<T> entities)
    {
        _dbSet.UpdateRange(entities);
    }

    /// <summary>
    /// Delete entity by ID
    /// </summary>
    public virtual async Task<bool> DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null)
            return false;

        _dbSet.Remove(entity);
        return true;
    }

    /// <summary>
    /// Delete entity
    /// </summary>
    public virtual async Task<bool> DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return true;
    }

    /// <summary>
    /// Delete multiple entities
    /// </summary>
    public virtual async Task<bool> DeleteRangeAsync(IEnumerable<T> entities)
    {
        _dbSet.RemoveRange(entities);
        return true;
    }

    /// <summary>
    /// Save changes to database
    /// </summary>
    public virtual async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Get queryable for advanced LINQ operations
    /// </summary>
    public virtual IQueryable<T> GetQueryable()
    {
        return _dbSet.AsQueryable();
    }

    /// <summary>
    /// Get with eager loading of related entities
    /// </summary>
    public virtual async Task<T?> GetByIdWithIncludesAsync(int id, params Expression<Func<T, object>>[] includes)
    {
        var query = _dbSet as IQueryable<T>;
        
        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.FirstOrDefaultAsync(GetIdPredicate(id));
    }

    /// <summary>
    /// Find with eager loading of related entities
    /// </summary>
    public virtual async Task<IEnumerable<T>> FindWithIncludesAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
    {
        var query = _dbSet as IQueryable<T>;
        
        foreach (var include in includes)
        {
            query = query.Include(include);
        }

        return await query.Where(predicate).ToListAsync();
    }

    /// <summary>
    /// Helper to get ID predicate (assumes entity has Id property)
    /// </summary>
    protected Expression<Func<T, bool>> GetIdPredicate(int id)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var property = Expression.Property(parameter, "Id");
        var constant = Expression.Constant(id);
        var equality = Expression.Equal(property, constant);
        
        return Expression.Lambda<Func<T, bool>>(equality, parameter);
    }
}

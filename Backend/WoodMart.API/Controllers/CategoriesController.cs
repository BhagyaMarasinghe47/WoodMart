using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.DTOs.Category;
using WoodMart.Application.Interfaces;

namespace WoodMart.API.Controllers;

/// <summary>
/// Category management endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(ICategoryService categoryService, ILogger<CategoriesController> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    /// <summary>
    /// Get all categories with subcategories.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAllCategories()
    {
        try
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching categories");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get category by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryDto>> GetCategoryById(int id)
    {
        try
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching category {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get subcategories for a category.
    /// </summary>
    [HttpGet("{id}/subcategories")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<SubcategoryDto>>> GetSubcategories(int id)
    {
        try
        {
            var subcategories = await _categoryService.GetSubcategoriesByCategoryAsync(id);
            return Ok(subcategories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching subcategories for category {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new category.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateUpdateCategoryDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, category) = await _categoryService.CreateCategoryAsync(request);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetCategoryById), new { id = category?.Id }, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing category.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] CreateUpdateCategoryDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, category) = await _categoryService.UpdateCategoryAsync(id, request);
            if (!success)
                return NotFound(new { message });

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating category {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a category.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var (success, message) = await _categoryService.DeleteCategoryAsync(id);
            if (!success)
                return NotFound(new { message });

            return Ok(new { message = "Category deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new subcategory.
    /// </summary>
    [HttpPost("{id}/subcategories")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SubcategoryDto>> CreateSubcategory(int id, [FromBody] CreateUpdateSubcategoryDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Override category ID from route
            request.CategoryId = id;
            var (success, message, subcategory) = await _categoryService.CreateSubcategoryAsync(request);
            if (!success)
                return BadRequest(new { message });

            return CreatedAtAction(nameof(GetSubcategoryById), new { categoryId = id, subId = subcategory?.Id }, subcategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subcategory");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get a subcategory by ID.
    /// </summary>
    [HttpGet("subcategories/{subId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubcategoryDto>> GetSubcategoryById(int subId)
    {
        try
        {
            var subcategory = await _categoryService.GetSubcategoryByIdAsync(subId);
            if (subcategory == null)
                return NotFound(new { message = "Subcategory not found" });

            return Ok(subcategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching subcategory {Id}", subId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update a subcategory.
    /// </summary>
    [HttpPut("subcategories/{subId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubcategoryDto>> UpdateSubcategory(int subId, [FromBody] CreateUpdateSubcategoryDto request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, subcategory) = await _categoryService.UpdateSubcategoryAsync(subId, request);
            if (!success)
                return NotFound(new { message });

            return Ok(subcategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subcategory {Id}", subId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a subcategory.
    /// </summary>
    [HttpDelete("subcategories/{subId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSubcategory(int subId)
    {
        try
        {
            var (success, message) = await _categoryService.DeleteSubcategoryAsync(subId);
            if (!success)
                return NotFound(new { message });

            return Ok(new { message = "Subcategory deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subcategory {Id}", subId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}

namespace WoodMart.Application.DTOs.Common;

/// <summary>
/// Standard API response wrapper for successful operations.
/// </summary>
/// <typeparam name="T">Type of response data.</typeparam>
public class ApiResponseDto<T>
{
    /// <summary>
    /// Whether the operation was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Response message.
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Response data payload.
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// HTTP status code.
    /// </summary>
    public int StatusCode { get; set; } = 200;
}

/// <summary>
/// Standard API response wrapper for error operations.
/// </summary>
public class ErrorResponseDto
{
    /// <summary>
    /// Error code/identifier.
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// Error message.
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Detailed error information.
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// HTTP status code.
    /// </summary>
    public int StatusCode { get; set; } = 400;

    /// <summary>
    /// Timestamp of error occurrence.
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// DTO for paginated responses.
/// </summary>
/// <typeparam name="T">Type of items in the page.</typeparam>
public class PagedResultDto<T>
{
    /// <summary>
    /// Current page number (1-based).
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Total number of pages.
    /// </summary>
    public int TotalPages => (TotalCount + PageSize - 1) / PageSize;

    /// <summary>
    /// Items in the current page.
    /// </summary>
    public List<T> Items { get; set; } = new();

    /// <summary>
    /// Whether there is a next page.
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;

    /// <summary>
    /// Whether there is a previous page.
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;
}

/// <summary>
/// DTO for pagination parameters.
/// </summary>
public class PaginationParamsDto
{
    /// <summary>
    /// Page number (1-based).
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Page size (items per page).
    /// </summary>
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// Search query string.
    /// </summary>
    public string? SearchQuery { get; set; }

    /// <summary>
    /// Sort field name.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort order (asc or desc).
    /// </summary>
    public string SortOrder { get; set; } = "asc";
}

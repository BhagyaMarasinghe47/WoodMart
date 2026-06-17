namespace WoodMart.Application.DTOs.Auth;

/// <summary>
/// Response DTO for successful authentication containing tokens and user information.
/// </summary>
public class AuthResponseDto
{
    /// <summary>
    /// JWT access token for API requests.
    /// </summary>
    public required string AccessToken { get; set; }

    /// <summary>
    /// Refresh token for obtaining new access tokens.
    /// </summary>
    public required string RefreshToken { get; set; }

    /// <summary>
    /// Access token expiration time in seconds.
    /// </summary>
    public int ExpiresIn { get; set; } = 900; // 15 minutes

    /// <summary>
    /// Token type (Bearer).
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// Authenticated user information.
    /// </summary>
    public required UserAuthDto User { get; set; }
}

/// <summary>
/// User information included in authentication response.
/// </summary>
public class UserAuthDto
{
    /// <summary>
    /// User ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User first name.
    /// </summary>
    public required string FirstName { get; set; }

    /// <summary>
    /// User last name.
    /// </summary>
    public required string LastName { get; set; }

    /// <summary>
    /// User role name.
    /// </summary>
    public required string Role { get; set; }

    /// <summary>
    /// User status.
    /// </summary>
    public required string Status { get; set; }
}

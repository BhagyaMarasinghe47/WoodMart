using WoodMart.Domain.Entities;

namespace WoodMart.Application.Interfaces;

/// <summary>
/// Interface for authentication service handling user registration, login, and token management.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user with the provided registration details.
    /// </summary>
    /// <param name="email">User email address.</param>
    /// <param name="password">User password (will be hashed).</param>
    /// <param name="firstName">User first name.</param>
    /// <param name="lastName">User last name.</param>
    /// <param name="roleId">Role ID for the new user.</param>
    /// <returns>Tuple containing success flag, message, and created user if successful.</returns>
    Task<(bool Success, string Message, User? User)> RegisterAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        int roleId,
        string? phoneNumber = null,
        string? city = null);

    /// <summary>
    /// Authenticates a user and generates JWT access token and refresh token.
    /// </summary>
    /// <param name="email">User email address.</param>
    /// <param name="password">User password.</param>
    /// <returns>Tuple containing success flag, message, access token, refresh token, and user.</returns>
    Task<(bool Success, string Message, string? AccessToken, string? RefreshToken, User? User)> LoginAsync(string email, string password);

    /// <summary>
    /// Generates a new access token using a valid refresh token.
    /// </summary>
    /// <param name="refreshToken">Existing refresh token.</param>
    /// <returns>Tuple containing success flag, message, and new access token.</returns>
    Task<(bool Success, string Message, string? AccessToken)> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Revokes a refresh token (logout functionality).
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="refreshToken">Refresh token to revoke.</param>
    /// <returns>True if revocation was successful.</returns>
    Task<bool> RevokeRefreshTokenAsync(int userId, string refreshToken);

    /// <summary>
    /// Validates a refresh token and returns the associated user ID.
    /// </summary>
    /// <param name="refreshToken">Refresh token to validate.</param>
    /// <returns>User ID if valid, null if invalid.</returns>
    Task<int?> ValidateRefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Generates a JWT access token for an authenticated user.
    /// </summary>
    /// <param name="user">The authenticated user.</param>
    /// <returns>JWT access token string.</returns>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Generates a refresh token for token renewal.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <returns>Refresh token string.</returns>
    Task<string> GenerateRefreshTokenAsync(int userId);

    /// <summary>
    /// Hashes a plain text password using BCrypt.
    /// </summary>
    /// <param name="password">Plain text password.</param>
    /// <returns>Hashed password.</returns>
    string HashPassword(string password);

    /// <summary>
    /// Verifies a plain text password against a hashed password.
    /// </summary>
    /// <param name="password">Plain text password.</param>
    /// <param name="hash">Hashed password.</param>
    /// <returns>True if password matches hash.</returns>
    bool VerifyPassword(string password, string hash);
}

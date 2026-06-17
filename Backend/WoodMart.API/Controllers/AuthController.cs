using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;

namespace WoodMart.API.Controllers;

/// <summary>
/// Authentication controller handling user registration, login, and token management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user with email and password.
    /// </summary>
    /// <param name="request">Registration request containing email, password, and user details.</param>
    /// <returns>Success message and user details if registration is successful.</returns>
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required.");

        // Handle both single fullName and separate firstName/lastName
        string firstName = request.FirstName ?? string.Empty;
        string lastName = request.LastName ?? string.Empty;

        if (!string.IsNullOrWhiteSpace(request.FullName) && string.IsNullOrWhiteSpace(firstName))
        {
            var nameParts = request.FullName.Trim().Split(' ', 2);
            firstName = nameParts[0];
            lastName = nameParts.Length > 1 ? nameParts[1] : nameParts[0];
        }

        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            return BadRequest("Full name is required.");

        var (success, message, user) = await _authService.RegisterAsync(
            request.Email,
            request.Password,
            firstName,
            lastName,
            request.RoleId,
            request.PhoneNumber,
            request.City);

        if (!success)
            return BadRequest(new { success = false, message });

        _logger.LogInformation($"User registered successfully: {request.Email}");

        return Ok(new
        {
            success = true,
            message,
            user = MapUserResponse(user!)
        });
    }

    /// <summary>
    /// Authenticates a user and returns JWT access token and refresh token.
    /// </summary>
    /// <param name="request">Login request containing email and password.</param>
    /// <returns>Access token and refresh token if authentication is successful.</returns>
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required.");

        var (success, message, accessToken, refreshToken, user) = await _authService.LoginAsync(
            request.Email,
            request.Password);

        if (!success)
            return Unauthorized(new { success = false, message });

        _logger.LogInformation($"User logged in successfully: {request.Email}");

        return Ok(new
        {
            success = true,
            message,
            accessToken,
            refreshToken,
            user = MapUserResponse(user!)
        });
    }

    /// <summary>
    /// Generates a new access token using a valid refresh token.
    /// </summary>
    /// <param name="request">Refresh token request containing the existing refresh token.</param>
    /// <returns>New access token if refresh is successful.</returns>
    [HttpPost("refresh-token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        var (success, message, accessToken) = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (!success)
            return Unauthorized(new { message });

        _logger.LogInformation("Token refreshed successfully.");

        return Ok(new
        {
            message,
            accessToken
        });
    }

    /// <summary>
    /// Logs out a user by revoking their refresh token.
    /// </summary>
    /// <param name="request">Logout request containing the refresh token to revoke.</param>
    /// <returns>Success message if logout is successful.</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Get user ID from JWT claims
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("Invalid token.");

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        var success = await _authService.RevokeRefreshTokenAsync(userId, request.RefreshToken);

        if (!success)
            return BadRequest("Failed to revoke token.");

        _logger.LogInformation($"User {userId} logged out successfully.");

        return Ok(new { message = "Logged out successfully." });
    }

    /// <summary>
    /// Gets the current authenticated user's information.
    /// </summary>
    /// <returns>Current user's claims information.</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);
        var nameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
        var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

        if (userIdClaim == null)
            return Unauthorized();

        return Ok(new
        {
            userId = userIdClaim.Value,
            email = emailClaim?.Value,
            name = nameClaim?.Value,
            role = roleClaim?.Value?.ToUpperInvariant()
        });
    }

    private static object MapUserResponse(User user)
    {
        var approvalStatus = user.UserStatusId switch
        {
            1 => "APPROVED",
            2 => "PENDING",
            3 => "REJECTED",
            4 => "DISABLED",
            _ => "PENDING"
        };

        return new
        {
            id = user.Id.ToString(),
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            role = user.Role?.Name?.ToUpperInvariant() ?? "CUSTOMER",
            approvalStatus,
            phone = user.PhoneNumber ?? string.Empty,
            profileImageUrl = user.ProfileImageUrl
        };
    }
}

/// <summary>
/// Request model for user registration.
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's full name (will be split into first and last name).
    /// </summary>
    public string? FullName { get; set; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User's password (minimum 8 characters).
    /// </summary>
    public required string Password { get; set; }

    /// <summary>
    /// User's first name.
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// User's last name.
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Role ID for the new user (1=Admin, 2=Craftsman, 3=Vendor, 4=Customer).
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Optional contact phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Optional city or area.
    /// </summary>
    public string? City { get; set; }
}

/// <summary>
/// Request model for user login.
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User's password.
    /// </summary>
    public required string Password { get; set; }
}

/// <summary>
/// Request model for token refresh.
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// The refresh token to use for generating a new access token.
    /// </summary>
    public required string RefreshToken { get; set; }
}

/// <summary>
/// Request model for user logout.
/// </summary>
public class LogoutRequest
{
    /// <summary>
    /// The refresh token to revoke.
    /// </summary>
    public required string RefreshToken { get; set; }
}

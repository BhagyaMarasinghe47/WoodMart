using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Repositories;

namespace WoodMart.Infrastructure.Services;

/// <summary>
/// Authentication service for user registration, login, and token management.
/// </summary>
public class AuthService : IAuthService
{
    private const int ActiveStatusId = 1;
    private const int PendingStatusId = 2;
    private const int CustomerRoleId = 4;

    private readonly UserRepository _userRepository;
    private readonly IRepository<RefreshToken> _refreshTokenRepository;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpirationMinutes;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        UserRepository userRepository,
        IRepository<RefreshToken> refreshTokenRepository,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;

        var jwtSettings = configuration.GetSection("JwtSettings");
        _jwtSecret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT secret not configured");
        _jwtIssuer = jwtSettings["Issuer"] ?? "WoodMart";
        _jwtAudience = jwtSettings["Audience"] ?? "WoodMartUsers";
        _jwtExpirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "15");
        _refreshTokenExpirationDays = int.Parse(jwtSettings["RefreshTokenExpirationDays"] ?? "7");
    }

    public async Task<(bool Success, string Message, User? User)> RegisterAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        int roleId,
        string? phoneNumber = null,
        string? city = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return (false, "Email and password are required.", null);

            if (password.Length < 8)
                return (false, "Password must be at least 8 characters long.", null);

            var existingUser = await _userRepository.GetByEmailAsync(email);
            if (existingUser != null)
                return (false, "User with this email already exists.", null);

            var isCustomer = roleId == CustomerRoleId;
            var hashedPassword = HashPassword(password);
            var newUser = new User
            {
                Email = email,
                PasswordHash = hashedPassword,
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = phoneNumber,
                City = city,
                Address = null,
                State = null,
                PostalCode = null,
                Country = null,
                RoleId = roleId,
                UserStatusId = isCustomer ? ActiveStatusId : PendingStatusId,
                ApprovedAt = isCustomer ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(newUser);
            await _userRepository.SaveChangesAsync();

            var createdUser = await _userRepository.GetByEmailAsync(email);
            var message = isCustomer
                ? "Registration successful. You can now log in."
                : "Registration successful. Awaiting admin approval.";

            return (true, message, createdUser);
        }
        catch (Exception ex)
        {
            return (false, $"Registration failed: {ex.Message}", null);
        }
    }

    public async Task<(bool Success, string Message, string? AccessToken, string? RefreshToken, User? User)> LoginAsync(
        string email,
        string password)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return (false, "Email and password are required.", null, null, null);

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
                return (false, "Invalid email or password.", null, null, null);

            if (user.UserStatusId != ActiveStatusId)
            {
                var pendingMessage = user.UserStatusId == PendingStatusId
                    ? "Your account is pending admin approval."
                    : "User account is not active. Please contact administrator.";
                return (false, pendingMessage, null, null, null);
            }

            if (!VerifyPassword(password, user.PasswordHash))
                return (false, "Invalid email or password.", null, null, null);

            var accessToken = GenerateAccessToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id);

            return (true, "Login successful.", accessToken, refreshToken, user);
        }
        catch (Exception ex)
        {
            return (false, $"Login failed: {ex.Message}", null, null, null);
        }
    }

    public async Task<(bool Success, string Message, string? AccessToken)> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return (false, "Refresh token is required.", null);

            // Validate refresh token
            var userId = await ValidateRefreshTokenAsync(refreshToken);
            if (userId == null)
                return (false, "Invalid or expired refresh token.", null);

            // Get user
            var user = await _userRepository.GetByIdWithRoleAsync(userId.Value);
            if (user == null || user.UserStatusId != ActiveStatusId)
                return (false, "User not found or account is not active.", null);

            // Generate new access token
            var newAccessToken = GenerateAccessToken(user);
            return (true, "Token refreshed successfully.", newAccessToken);
        }
        catch (Exception ex)
        {
            return (false, $"Token refresh failed: {ex.Message}", null);
        }
    }

    public async Task<bool> RevokeRefreshTokenAsync(int userId, string refreshToken)
    {
        try
        {
            // Find and delete the refresh token
            var token = await _refreshTokenRepository.FirstOrDefaultAsync(rt => 
                rt.UserId == userId && rt.TokenHash == HashToken(refreshToken) && rt.IsRevoked == false);
            
            if (token == null)
                return false;

            await _refreshTokenRepository.DeleteAsync(token);
            await _refreshTokenRepository.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<int?> ValidateRefreshTokenAsync(string refreshToken)
    {
        try
        {
            var token = await _refreshTokenRepository.FirstOrDefaultAsync(rt => 
                rt.TokenHash == HashToken(refreshToken) && rt.ExpiresAt > DateTime.UtcNow && rt.IsRevoked == false);
            
            return token?.UserId;
        }
        catch
        {
            return null;
        }
    }

    public string GenerateAccessToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_jwtSecret);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.Role?.Name?.ToUpperInvariant() ?? "CUSTOMER")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtExpirationMinutes),
            Issuer = _jwtIssuer,
            Audience = _jwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<string> GenerateRefreshTokenAsync(int userId)
    {
        var rawToken = GenerateRandomToken();
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        await _refreshTokenRepository.AddAsync(refreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        return rawToken;
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    /// <summary>
    /// Generates a random token string for refresh tokens.
    /// </summary>
    private string GenerateRandomToken()
    {
        var randomNumber = new byte[64];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }

    /// <summary>
    /// Hashes a token string using SHA256 for secure storage.
    /// </summary>
    private string HashToken(string token)
    {
        using (var sha256 = System.Security.Cryptography.SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}

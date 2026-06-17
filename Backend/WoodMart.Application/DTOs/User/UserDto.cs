namespace WoodMart.Application.DTOs.User;

/// <summary>
/// DTO for user profile information.
/// </summary>
public class UserDto
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
    /// User phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// User role ID.
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// User role name.
    /// </summary>
    public string? RoleName { get; set; }

    /// <summary>
    /// User status ID.
    /// </summary>
    public int UserStatusId { get; set; }

    /// <summary>
    /// User status name.
    /// </summary>
    public string? StatusName { get; set; }

    /// <summary>
    /// Account creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last account update timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for updating user profile information.
/// </summary>
public class UpdateUserDto
{
    /// <summary>
    /// Updated first name.
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// Updated last name.
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// Updated phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Updated password (if changing).
    /// </summary>
    public string? NewPassword { get; set; }

    /// <summary>
    /// Current password required for verification when changing password.
    /// </summary>
    public string? CurrentPassword { get; set; }
}

/// <summary>
/// DTO for user dashboard/profile view with related data.
/// </summary>
public class UserProfileDto
{
    /// <summary>
    /// User basic information.
    /// </summary>
    public required UserDto User { get; set; }

    /// <summary>
    /// Count of user's orders (for customers).
    /// </summary>
    public int OrderCount { get; set; }

    /// <summary>
    /// Total spending (for customers).
    /// </summary>
    public decimal TotalSpending { get; set; }

    /// <summary>
    /// Count of user's products (for craftsmen/vendors).
    /// </summary>
    public int ProductCount { get; set; }

    /// <summary>
    /// User's average rating (for vendors/craftsmen).
    /// </summary>
    public decimal AverageRating { get; set; }
}

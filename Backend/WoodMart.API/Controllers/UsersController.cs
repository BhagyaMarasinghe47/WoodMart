using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WoodMart.Application.Interfaces;
using WoodMart.Domain.Entities;
using WoodMart.Infrastructure.Repositories;

namespace WoodMart.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserRepository _userRepository;
    private readonly IWebHostEnvironment _environment;

    public UsersController(UserRepository userRepository, IWebHostEnvironment environment)
    {
        _userRepository = userRepository;
        _environment = environment;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("pending-approval")]
    [ProducesResponseType(typeof(IEnumerable<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingApprovalUsers()
    {
        var users = await _userRepository.GetPendingApprovalAsync();
        return Ok(users.Select(MapUserListItem));
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveUsers()
    {
        var users = await _userRepository.GetActiveUsersAsync();
        return Ok(users.Select(MapUserListItem));
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchUsers([FromQuery] string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return BadRequest(new { message = "Search term is required" });

        var users = await _userRepository.SearchByNameAsync(searchTerm);
        return Ok(users.Select(MapUserListItem));
    }

    [HttpGet("role-stats")]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserCountByRole()
    {
        var stats = await _userRepository.GetUserCountByRoleAsync();
        return Ok(stats);
    }

    [HttpGet("role/{roleId}")]
    [ProducesResponseType(typeof(IEnumerable<User>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsersByRole(int roleId)
    {
        var users = await _userRepository.GetByRoleAsync(roleId);
        return Ok(users.Select(MapUserListItem));
    }

    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    [HttpPost("upload-profile-image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

        const long maxSize = 3 * 1024 * 1024;
        if (file.Length > maxSize)
            return BadRequest(new { message = "Image must be under 3 MB." });

        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "images", "profiles");
        Directory.CreateDirectory(uploadsFolder);

        var extension = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { imageUrl = $"images/profiles/{fileName}" });
    }

    [HttpPut("{id}/profile")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileRequest request)
    {
        var user = await _userRepository.GetByIdWithRoleAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName;
        if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName;
        if (request.Phone != null) user.PhoneNumber = request.Phone;
        if (request.City != null) user.City = request.City;
        if (request.ProfileImageUrl != null) user.ProfileImageUrl = request.ProfileImageUrl;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        return Ok(new { success = true, message = "Profile updated.", user = MapUserListItem(user) });
    }

    [HttpPost("fix-seed-passwords")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FixSeedPasswords()
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        var admin = await _userRepository.GetByEmailAsync("admin@woodmart.com");
        if (admin != null)
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
            admin.UserStatusId = 1;
            admin.RoleId = 1;
            admin.ApprovedAt ??= DateTime.UtcNow;
            admin.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(admin);
        }

        var customer = await _userRepository.GetByEmailAsync("customer@woodmart.com");
        if (customer == null)
        {
            customer = new User
            {
                Email = "customer@woodmart.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("customer123"),
                FirstName = "Bob",
                LastName = "Customer",
                PhoneNumber = "0771234567",
                RoleId = 4,
                UserStatusId = 1,
                ApprovedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _userRepository.AddAsync(customer);
        }
        else
        {
            customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword("customer123");
            customer.UserStatusId = 1;
            customer.RoleId = 4;
            customer.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(customer);
        }

        await _userRepository.SaveChangesAsync();
        return Ok(new { success = true, message = "Seed user passwords and statuses updated." });
    }

    [HttpPost("{id}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveUser(int id)
    {
        var user = await _userRepository.GetByIdWithRoleAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        user.UserStatusId = 1;
        user.ApprovedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        return Ok(new { success = true, message = "User approved successfully." });
    }

    [HttpPost("{id}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectUser(int id)
    {
        var user = await _userRepository.GetByIdWithRoleAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        user.UserStatusId = 3;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();

        return Ok(new { success = true, message = "User rejected successfully." });
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userRepository.GetByIdWithRoleAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    [HttpGet("{id}/dashboard")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserForDashboard(int id)
    {
        var user = await _userRepository.GetForDashboardAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _userRepository.GetByIdWithRoleAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (user.RoleId == 1)
            return BadRequest(new { message = "Admin accounts cannot be deleted." });

        var deleted = await _userRepository.DeleteAsync(id);
        if (!deleted)
            return BadRequest(new { message = "Failed to delete user." });

        await _userRepository.SaveChangesAsync();

        return Ok(new { success = true, message = $"User '{user.Email}' deleted successfully." });
    }

    private static object MapUserListItem(User user)
    {
        return new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            phoneNumber = user.PhoneNumber ?? string.Empty,
            city = user.City,
            address = user.Address,
            roleId = user.RoleId,
            userStatusId = user.UserStatusId,
            createdAt = user.CreatedAt,
            profileImageUrl = user.ProfileImageUrl,
            role = user.Role == null ? null : new { id = user.Role.Id, name = user.Role.Name },
            userStatus = user.UserStatus == null ? null : new { id = user.UserStatus.Id, name = user.UserStatus.Name }
        };
    }
}

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? ProfileImageUrl { get; set; }
}

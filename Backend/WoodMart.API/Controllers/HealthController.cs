using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WoodMart.Infrastructure.Data;

namespace WoodMart.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly WoodMartDbContext _context;

    public HealthController(WoodMartDbContext context)
    {
        _context = context;
    }

    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { message = "API is running", timestamp = DateTime.UtcNow });
    }

    [HttpGet("db-status")]
    public async Task<IActionResult> DbStatus()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            if (!canConnect)
                return StatusCode(503, new { status = "Database connection failed" });

            var rolesCount = await _context.Roles.CountAsync();
            var usersCount = await _context.Users.CountAsync();

            return Ok(new
            {
                status = "Connected",
                database = "WoodMart",
                rolesCount,
                usersCount,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

using System.Text.Json;
using Icv.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Controllers;

[ApiController, Authorize, Route("api/users")]
public sealed class UsersController(
    IcvIdentityDbContext db,
    UserManager<IdentityUser> users) : ControllerBase
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.Ordinal)
        { "admin", "section_head", "editor", "viewer", "temporary_viewer" };

    public sealed record CreateUserRequest(
        string Username, string FullName, string Role, string TemporaryPassword,
        bool IsActive, DateTimeOffset? AccessStartsAt, DateTimeOffset? AccessExpiresAt);

    public sealed record UpdateUserRequest(
        string FullName, string Role, bool IsActive,
        DateTimeOffset? AccessStartsAt, DateTimeOffset? AccessExpiresAt);

    private async Task<Guid?> CurrentAdminId()
    {
        if (!Guid.TryParse(users.GetUserId(User), out var id)) return null;
        var now = DateTimeOffset.UtcNow;
        var profile = await db.UserProfiles.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id);
        return profile is not null && profile.IsActive && profile.Role == "admin" &&
            (!profile.AccessStartsAt.HasValue || profile.AccessStartsAt <= now) &&
            (!profile.AccessExpiresAt.HasValue || profile.AccessExpiresAt > now)
                ? id : null;
    }

    private static bool ValidAccess(string role, DateTimeOffset? starts, DateTimeOffset? expires) =>
        AllowedRoles.Contains(role) &&
        (!starts.HasValue || !expires.HasValue || expires > starts) &&
        (role != "temporary_viewer" || expires.HasValue);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        if (await CurrentAdminId() is null) return Forbid();
        var rows = await (from p in db.UserProfiles.AsNoTracking()
                          join u in db.Users.AsNoTracking()
                              on p.Id.ToString() equals u.Id
                          orderby p.FullName
                          select new
                          {
                              id = p.Id, username = u.UserName, fullName = p.FullName,
                              role = p.Role, isActive = p.IsActive,
                              accessStartsAt = p.AccessStartsAt,
                              accessExpiresAt = p.AccessExpiresAt,
                              createdAt = p.CreatedAt, updatedAt = p.UpdatedAt
                          }).ToListAsync();
        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        var actorId = await CurrentAdminId();
        if (actorId is null) return Forbid();
        var username = request.Username?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(username) || username.Length > 256 ||
            string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.TemporaryPassword) ||
            !ValidAccess(request.Role, request.AccessStartsAt, request.AccessExpiresAt))
            return BadRequest(new { error = "تحقق من اسم المستخدم والاسم الكامل والدور وفترة الصلاحية وكلمة المرور المؤقتة" });

        var now = DateTimeOffset.UtcNow;
        var id = Guid.NewGuid();
        await using var transaction = await db.Database.BeginTransactionAsync();
        var user = new IdentityUser { Id = id.ToString(), UserName = username, LockoutEnabled = true };
        var created = await users.CreateAsync(user, request.TemporaryPassword);
        if (!created.Succeeded)
        {
            await transaction.RollbackAsync();
            return BadRequest(new { errors = created.Errors.Select(e => e.Description) });
        }

        var profile = new UserProfile
        {
            Id = id, Username = username, FullName = request.FullName.Trim(),
            Role = request.Role, IsActive = request.IsActive,
            AccessStartsAt = request.AccessStartsAt, AccessExpiresAt = request.AccessExpiresAt,
            CreatedAt = now, UpdatedAt = now
        };
        db.UserProfiles.Add(profile);
        db.AuditEntries.Add(new AuditEntry
        {
            ActorUserId = actorId, Operation = "CREATE_USER", TableName = "user_profiles",
            RecordId = id.ToString(),
            NewData = JsonSerializer.Serialize(new { profile.Id, profile.Username, profile.FullName,
                profile.Role, profile.IsActive, profile.AccessStartsAt, profile.AccessExpiresAt }),
            ChangedAt = now
        });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return CreatedAtAction(nameof(List), new { id }, new
        {
            id, username, fullName = profile.FullName, role = profile.Role,
            isActive = profile.IsActive, accessStartsAt = profile.AccessStartsAt,
            accessExpiresAt = profile.AccessExpiresAt
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest request)
    {
        var actorId = await CurrentAdminId();
        if (actorId is null) return Forbid();
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            !ValidAccess(request.Role, request.AccessStartsAt, request.AccessExpiresAt))
            return BadRequest(new { error = "تحقق من الاسم والدور وفترة الصلاحية" });

        var profile = await db.UserProfiles.SingleOrDefaultAsync(x => x.Id == id);
        var user = await users.FindByIdAsync(id.ToString());
        if (profile is null || user is null) return NotFound();

        if (id == actorId && (!request.IsActive || request.Role != "admin"))
            return Conflict(new { error = "لا يمكنك تعطيل حسابك أو إزالة صلاحية المدير من حسابك الحالي" });

        if (profile.Role == "admin" && profile.IsActive &&
            (!request.IsActive || request.Role != "admin"))
        {
            var activeAdmins = await db.UserProfiles.CountAsync(x =>
                x.Role == "admin" && x.IsActive && x.Id != id &&
                (!x.AccessStartsAt.HasValue || x.AccessStartsAt <= DateTimeOffset.UtcNow) &&
                (!x.AccessExpiresAt.HasValue || x.AccessExpiresAt > DateTimeOffset.UtcNow));
            if (activeAdmins == 0)
                return Conflict(new { error = "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير نشط" });
        }

        var old = JsonSerializer.Serialize(new
        {
            profile.FullName, profile.Role, profile.IsActive,
            profile.AccessStartsAt, profile.AccessExpiresAt
        });
        profile.FullName = request.FullName.Trim();
        profile.Role = request.Role;
        profile.IsActive = request.IsActive;
        profile.AccessStartsAt = request.AccessStartsAt;
        profile.AccessExpiresAt = request.AccessExpiresAt;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        db.AuditEntries.Add(new AuditEntry
        {
            ActorUserId = actorId, Operation = "UPDATE_USER", TableName = "user_profiles",
            RecordId = id.ToString(), OldData = old,
            NewData = JsonSerializer.Serialize(new
            {
                profile.FullName, profile.Role, profile.IsActive,
                profile.AccessStartsAt, profile.AccessExpiresAt
            }),
            ChangedAt = profile.UpdatedAt
        });
        await db.SaveChangesAsync();

        // Revoke existing sessions when account access or role is changed.
        await users.UpdateSecurityStampAsync(user);
        return Ok(new { id, username = user.UserName, fullName = profile.FullName,
            role = profile.Role, isActive = profile.IsActive,
            accessStartsAt = profile.AccessStartsAt, accessExpiresAt = profile.AccessExpiresAt });
    }
}

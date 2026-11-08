using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Icv.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    SignInManager<IdentityUser> signIn,
    UserManager<IdentityUser> users) : ControllerBase
{
    public sealed record LoginRequest(string Username, string Password);
    public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { error = "أدخل اسم المستخدم وكلمة المرور" });

        var username = request.Username.Trim().ToLowerInvariant();
        var result = await signIn.PasswordSignInAsync(
            username, request.Password, isPersistent: false, lockoutOnFailure: true);

        if (result.IsLockedOut)
            return Unauthorized(new { error = "تم إيقاف تسجيل الدخول مؤقتًا بسبب المحاولات غير الناجحة" });
        if (!result.Succeeded)
            return Unauthorized(new { error = "بيانات الدخول غير صحيحة" });

        var user = await users.FindByNameAsync(username);
        if (user is null)
        {
            await signIn.SignOutAsync();
            return Unauthorized(new { error = "تعذر التحقق من الحساب" });
        }

        var roles = await users.GetRolesAsync(user);
        return Ok(new { id = user.Id, username = user.UserName, roles });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return Ok(new {
            id = user.Id,
            username = user.UserName,
            roles = await users.GetRolesAsync(user)
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signIn.SignOutAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.NewPassword) || request.NewPassword.Length < 12)
            return BadRequest(new { error = "يجب ألا تقل كلمة المرور الجديدة عن 12 حرفًا" });

        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await signIn.RefreshSignInAsync(user);
        return NoContent();
    }
}

using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace Icv.Api.Controllers;

[ApiController]
[Route("api/security")]
public sealed class SecurityController(IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("csrf")]
    public IActionResult GetCsrfToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        Response.Headers.CacheControl = "no-store";
        return Ok(new { token = tokens.RequestToken });
    }
}
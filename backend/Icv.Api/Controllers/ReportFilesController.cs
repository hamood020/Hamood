using System.Text.Json;
using Icv.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Controllers;

[ApiController, Authorize, Route("api/files")]
public sealed class ReportFilesController(
    IcvIdentityDbContext db,
    UserManager<IdentityUser> users,
    IConfiguration config,
    IWebHostEnvironment env) : ControllerBase
{
    private const long MaxFileBytes = 20 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".pdf", ".xlsx", ".xls", ".doc", ".docx" };

    private async Task<(UserProfile? Profile, Guid? UserId)> Actor()
    {
        var raw = users.GetUserId(User);
        if (!Guid.TryParse(raw, out var id)) return (null, null);
        var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        var now = DateTimeOffset.UtcNow;
        if (profile is null || !profile.IsActive ||
            (profile.AccessStartsAt.HasValue && profile.AccessStartsAt > now) ||
            (profile.AccessExpiresAt.HasValue && profile.AccessExpiresAt <= now))
            return (null, id);
        return (profile, id);
    }

    private static bool Writer(string? role) => role is "admin" or "section_head" or "editor";

    private string Root
    {
        get
        {
            var configured = config["FileStorage:RootPath"];
            var path = Path.GetFullPath(string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(env.ContentRootPath, "App_Data", "PrivateFiles")
                : configured);
            return Path.TrimEndingDirectorySeparator(path);
        }
    }

    [HttpPost("reports/{reportId:guid}")]
    [RequestSizeLimit(MaxFileBytes)]
    public async Task<IActionResult> Upload(Guid reportId, IFormFile? file)
    {
        var (profile, userId) = await Actor();
        if (profile is null) return Unauthorized();
        if (!Writer(profile.Role)) return Forbid();

        if (file is null || file.Length <= 0 || file.Length > MaxFileBytes)
            return BadRequest(new { error = "الملف فارغ أو يتجاوز 20 ميجابايت" });

        var report = await db.QuarterlyReports.SingleOrDefaultAsync(x => x.Id == reportId);
        if (report is null) return NotFound();

        var originalName = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(originalName);
        if (string.IsNullOrWhiteSpace(originalName) || originalName.Length > 500 ||
            !AllowedExtensions.Contains(extension))
            return BadRequest(new { error = "نوع الملف غير مسموح. الأنواع المدعومة: PDF وExcel وWord" });

        await using var input = file.OpenReadStream();
        var signature = new byte[8];
        var read = await input.ReadAsync(signature.AsMemory(0, signature.Length));
        if (!HasExpectedSignature(extension, signature, read))
            return BadRequest(new { error = "محتوى الملف لا يطابق امتداده" });
        input.Position = 0;

        var relative = Path.Combine("reports", report.ProjectId.ToString("N"),
            report.Id.ToString("N"), Guid.NewGuid().ToString("N") + extension.ToLowerInvariant());
        var fullPath = Path.GetFullPath(Path.Combine(Root, relative));
        var rootPrefix = Root + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "مسار التخزين غير صالح" });

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        try
        {
            await using var output = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write,
                FileShare.None, 81920, FileOptions.Asynchronous | FileOptions.WriteThrough);
            await input.CopyToAsync(output);

            using var document = JsonDocument.Parse(report.ReportData);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
                throw new InvalidOperationException("بيانات التقرير ليست كائن JSON صالحًا.");

            var values = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(report.ReportData) ?? new();
            values["attachment_path"] = JsonSerializer.SerializeToElement(relative.Replace(Path.DirectorySeparatorChar, '/'));
            values["attachment_name"] = JsonSerializer.SerializeToElement(originalName);
            values["attachment_size"] = JsonSerializer.SerializeToElement(file.Length);
            var oldData = report.ReportData;
            report.ReportData = JsonSerializer.Serialize(values);
            db.AuditEntries.Add(new AuditEntry
            {
                ActorUserId = userId,
                Operation = "ATTACH",
                TableName = "quarterly_reports",
                RecordId = report.Id.ToString(),
                OldData = JsonSerializer.Serialize(new { attachment = "previous" }),
                NewData = JsonSerializer.Serialize(new { attachment_path = values["attachment_path"].GetString(), attachment_name = originalName, attachment_size = file.Length }),
                ChangedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync();
        }
        catch
        {
            if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
            throw;
        }

        return Ok(new { path = relative.Replace(Path.DirectorySeparatorChar, '/'), name = originalName, size = file.Length });
    }

    [HttpGet("{reportId:guid}/{fileName}")]
    public async Task<IActionResult> Download(Guid reportId, string fileName)
    {
        var (profile, _) = await Actor();
        if (profile is null) return Unauthorized();

        var report = await db.QuarterlyReports.AsNoTracking().SingleOrDefaultAsync(x => x.Id == reportId);
        if (report is null) return NotFound();

        using var document = JsonDocument.Parse(report.ReportData);
        if (!document.RootElement.TryGetProperty("attachment_path", out var property))
            return NotFound();

        var relative = property.GetString() ?? "";
        var expected = $"reports/{report.ProjectId:N}/{report.Id:N}/";
        if (!relative.StartsWith(expected, StringComparison.Ordinal) ||
            Path.GetFileName(relative) != fileName ||
            Path.GetFileName(fileName) != fileName)
            return NotFound();

        var fullPath = Path.GetFullPath(Path.Combine(Root, relative.Replace('/', Path.DirectorySeparatorChar)));
        if (!fullPath.StartsWith(Root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ||
            !System.IO.File.Exists(fullPath))
            return NotFound();

        var displayName = document.RootElement.TryGetProperty("attachment_name", out var name)
            ? Path.GetFileName(name.GetString() ?? fileName)
            : fileName;
        Response.Headers.CacheControl = "private, no-store";
        return PhysicalFile(fullPath, "application/octet-stream", displayName);
    }

    private static bool HasExpectedSignature(string extension, byte[] bytes, int length)
    {
        if (extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
            return length >= 5 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46 && bytes[4] == 0x2D;

        if (extension.Equals(".xls", StringComparison.OrdinalIgnoreCase) ||
            extension.Equals(".doc", StringComparison.OrdinalIgnoreCase))
            return length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 });

        // DOCX and XLSX are ZIP-based Office Open XML containers.
        return length >= 4 && bytes[0] == 0x50 && bytes[1] == 0x4B &&
            bytes[2] == 0x03 && bytes[3] == 0x04;
    }
}

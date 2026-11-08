using System.Security.Claims;
using System.Text.Json;
using Icv.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public sealed class ProjectsController(IcvIdentityDbContext db, UserManager<IdentityUser> users) : ControllerBase
{
    private static readonly string[] Writers = ["admin", "section_head", "editor"];

    private async Task<(UserProfile? Profile, Guid? UserId)> CurrentProfile()
    {
        var raw = users.GetUserId(User);
        if (!Guid.TryParse(raw, out var id)) return (null, null);
        var p = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        var now = DateTimeOffset.UtcNow;
        if (p is null || !p.IsActive || (p.AccessStartsAt.HasValue && p.AccessStartsAt > now) ||
            (p.AccessExpiresAt.HasValue && p.AccessExpiresAt <= now)) return (null, id);
        return (p, id);
    }

    private async Task<bool> CanWrite()
    {
        var (p, _) = await CurrentProfile();
        return p is not null && Writers.Contains(p.Role);
    }

    private async Task<IActionResult?> RequireActive()
    {
        var (p, _) = await CurrentProfile();
        return p is null ? Unauthorized(new { error = "الحساب غير نشط أو انتهت صلاحيته" }) : null;
    }

    public sealed record ProjectInput(
        int? SerialNo, Guid? GovernmentEntityId, string ProjectName, string? TenderType,
        string? ProjectStatus, string? Consultant, Guid? ImplementingCompanyId, string? WorkSector,
        decimal? TotalProjectValue, DateOnly? StartDate, DateOnly? EndDate, bool? LocalContentPlan, string? Notes);

    public sealed record ReportInput(string Quarter, string? AnnualPeriod, JsonElement ReportData, string? Notes, string? Status = null, DateOnly? SubmittedAt = null);

    [HttpGet("projects")]
    public async Task<IActionResult> ListProjects([FromQuery] string? search, [FromQuery] string? status,
        [FromQuery] Guid? governmentEntityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 200);
        var q = db.Projects.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.ProjectName.Contains(search) || (x.SerialNo != null && x.SerialNo.ToString() == search));
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.ProjectStatus == status);
        if (governmentEntityId.HasValue) q = q.Where(x => x.GovernmentEntityId == governmentEntityId);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(x => x.UpdatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("projects/{id:guid}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        var item = await db.Projects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("projects")]
    public async Task<IActionResult> CreateProject(ProjectInput input)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await CanWrite()) return Forbid();
        if (string.IsNullOrWhiteSpace(input.ProjectName)) return BadRequest(new { error = "اسم المشروع مطلوب" });
        if (input.TotalProjectValue < 0 || (input.StartDate.HasValue && input.EndDate.HasValue && input.EndDate < input.StartDate))
            return BadRequest(new { error = "تحقق من قيمة المشروع وتواريخه" });
        var (profile, userId) = await CurrentProfile();
        var now = DateTimeOffset.UtcNow;
        var p = new Project {
            Id = Guid.NewGuid(), SerialNo = input.SerialNo, GovernmentEntityId = input.GovernmentEntityId,
            ProjectName = input.ProjectName.Trim(), TenderType = input.TenderType, ProjectStatus = input.ProjectStatus,
            Consultant = input.Consultant, ImplementingCompanyId = input.ImplementingCompanyId, WorkSector = input.WorkSector,
            TotalProjectValue = input.TotalProjectValue, StartDate = input.StartDate, EndDate = input.EndDate,
            OriginalEndDate = input.EndDate, Notes = input.Notes, CreatedAt = now, UpdatedAt = now
        };
        db.Projects.Add(p);
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "INSERT", TableName = "projects", RecordId = p.Id.ToString(), NewData = JsonSerializer.Serialize(p), ChangedAt = now });
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProject), new { id = p.Id }, p);
    }

    [HttpPut("projects/{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, ProjectInput input)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await CanWrite()) return Forbid();
        if (string.IsNullOrWhiteSpace(input.ProjectName)) return BadRequest(new { error = "اسم المشروع مطلوب" });
        if (input.TotalProjectValue < 0 || (input.StartDate.HasValue && input.EndDate.HasValue && input.EndDate < input.StartDate))
            return BadRequest(new { error = "تحقق من قيمة المشروع وتواريخه" });
        var p = await db.Projects.SingleOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();
        var old = JsonSerializer.Serialize(p);
        var (profile, userId) = await CurrentProfile();
        var now = DateTimeOffset.UtcNow;
        if (p.EndDate != input.EndDate)
        {
            if (p.OriginalEndDate is null) p.OriginalEndDate = p.EndDate;
            db.Database.ExecuteSqlInterpolated($"INSERT INTO dbo.project_end_date_history(id,project_id,old_end_date,new_end_date,changed_by,changed_at,reason) VALUES ({Guid.NewGuid()},{p.Id},{p.EndDate},{input.EndDate},{userId},{now},{"تعديل تاريخ نهاية المشروع"})");
        }
        p.SerialNo = input.SerialNo; p.GovernmentEntityId = input.GovernmentEntityId;
        p.ProjectName = input.ProjectName.Trim(); p.TenderType = input.TenderType; p.ProjectStatus = input.ProjectStatus;
        p.Consultant = input.Consultant; p.ImplementingCompanyId = input.ImplementingCompanyId;
        p.WorkSector = input.WorkSector; p.TotalProjectValue = input.TotalProjectValue;
        p.StartDate = input.StartDate; p.EndDate = input.EndDate; p.LocalContentPlan = input.LocalContentPlan; p.Notes = input.Notes; p.UpdatedAt = now;
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "UPDATE", TableName = "projects", RecordId = id.ToString(), OldData = old, NewData = JsonSerializer.Serialize(p), ChangedAt = now });
        await db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpGet("projects/{id:guid}/reports")]
    public async Task<IActionResult> ListReports(Guid id)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await db.Projects.AnyAsync(x => x.Id == id)) return NotFound();
        return Ok(await db.QuarterlyReports.AsNoTracking().Where(x => x.ProjectId == id).OrderByDescending(x => x.CreatedAt).ToListAsync());
    }

    [HttpPost("projects/{id:guid}/reports")]
    public async Task<IActionResult> CreateReport(Guid id, ReportInput input)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await CanWrite()) return Forbid();
        if (!await db.Projects.AnyAsync(x => x.Id == id)) return NotFound();
        if (string.IsNullOrWhiteSpace(input.Quarter) || input.ReportData.ValueKind != JsonValueKind.Object)
            return BadRequest(new { error = "الفترة وبيانات التقرير بصيغة JSON مطلوبة" });
        var duplicate = await db.QuarterlyReports.AnyAsync(x => x.ProjectId == id && x.Quarter == input.Quarter && x.AnnualPeriod == input.AnnualPeriod);
        if (duplicate) return Conflict(new { error = "يوجد تقرير مسجل للمشروع والفترة نفسها" });
        var (_, userId) = await CurrentProfile();
        var report = new QuarterlyReport { Id = Guid.NewGuid(), ProjectId = id, Quarter = input.Quarter.Trim(),
            AnnualPeriod = input.AnnualPeriod, ReportData = input.ReportData.GetRawText(), Status = input.Status ?? "received", SubmittedAt = input.SubmittedAt,
            Notes = input.Notes, CreatedBy = userId, CreatedAt = DateTimeOffset.UtcNow };
        db.QuarterlyReports.Add(report);
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "INSERT", TableName = "quarterly_reports",
            RecordId = report.Id.ToString(), NewData = JsonSerializer.Serialize(report), ChangedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        return Created($"/api/reports/{report.Id}", report);
    }


    [HttpPut("projects/{projectId:guid}/reports/{reportId:guid}")]
    public async Task<IActionResult> UpdateReport(Guid projectId, Guid reportId, ReportInput input)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await CanWrite()) return Forbid();
        var report = await db.QuarterlyReports.SingleOrDefaultAsync(x => x.Id == reportId && x.ProjectId == projectId);
        if (report is null) return NotFound();
        if (report.Status == "approved") return Conflict(new { error = "التقرير المعتمد مقفل ولا يمكن تعديله" });
        if (string.IsNullOrWhiteSpace(input.Quarter) || input.ReportData.ValueKind != JsonValueKind.Object)
            return BadRequest(new { error = "الفترة وبيانات التقرير بصيغة JSON مطلوبة" });
        var duplicate = await db.QuarterlyReports.AnyAsync(x => x.Id != reportId && x.ProjectId == projectId && x.Quarter == input.Quarter && x.AnnualPeriod == input.AnnualPeriod);
        if (duplicate) return Conflict(new { error = "يوجد تقرير آخر مسجل للفترة نفسها" });
        var (_, userId) = await CurrentProfile(); var old = JsonSerializer.Serialize(report);
        report.Quarter = input.Quarter.Trim(); report.AnnualPeriod = input.AnnualPeriod;
        report.ReportData = input.ReportData.GetRawText(); report.Notes = input.Notes; report.Status = input.Status ?? report.Status; report.SubmittedAt = input.SubmittedAt ?? report.SubmittedAt;
        await db.SaveChangesAsync();
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "UPDATE", TableName = "quarterly_reports",
            RecordId = report.Id.ToString(), OldData = old, NewData = JsonSerializer.Serialize(report), ChangedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        return Ok(report);
    }

    [HttpPost("reports/{id:guid}/submit")]
    public async Task<IActionResult> SubmitReport(Guid id)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        if (!await CanWrite()) return Forbid();
        var r = await db.QuarterlyReports.SingleOrDefaultAsync(x => x.Id == id);
        if (r is null) return NotFound();
        if (r.Status is "approved") return Conflict(new { error = "لا يمكن إعادة إرسال تقرير معتمد" });
        var (_, userId) = await CurrentProfile(); var old = r.Status;
        r.Status = "submitted"; r.SubmittedAt = DateOnly.FromDateTime(DateTime.UtcNow);
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "SUBMIT", TableName = "quarterly_reports",
            RecordId = id.ToString(), OldData = JsonSerializer.Serialize(new { status = old }),
            NewData = JsonSerializer.Serialize(new { status = r.Status }), ChangedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(); return Ok(r);
    }

    [HttpPost("reports/{id:guid}/approve")]
    public async Task<IActionResult> ApproveReport(Guid id)
    {
        var denied = await RequireActive(); if (denied is not null) return denied;
        var (profile, userId) = await CurrentProfile();
        if (profile is null || profile.Role is not ("admin" or "section_head")) return Forbid();
        var r = await db.QuarterlyReports.SingleOrDefaultAsync(x => x.Id == id);
        if (r is null) return NotFound();
        if (r.Status != "submitted") return Conflict(new { error = "يجب إرسال التقرير قبل اعتماده" });
        r.Status = "approved"; r.ReviewedAt = DateOnly.FromDateTime(DateTime.UtcNow);
        db.AuditEntries.Add(new AuditEntry { ActorUserId = userId, Operation = "APPROVE", TableName = "quarterly_reports",
            RecordId = id.ToString(), NewData = JsonSerializer.Serialize(new { status = r.Status }), ChangedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(); return Ok(r);
    }
}

using System.Text.Json;
using Icv.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Controllers;

[ApiController,Authorize,Route("api")]
public sealed class WorkspaceController(IcvIdentityDbContext db,UserManager<IdentityUser> users):ControllerBase
{
 private static readonly string[] Writers=["admin","section_head","editor"];
 private async Task<(UserProfile? p,Guid? id)> Actor(){
  var raw=users.GetUserId(User); if(!Guid.TryParse(raw,out var id)) return (null,null);
  var p=await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id); var now=DateTimeOffset.UtcNow;
  if(p is null||!p.IsActive||(p.AccessStartsAt.HasValue&&p.AccessStartsAt>now)||(p.AccessExpiresAt.HasValue&&p.AccessExpiresAt<=now))return(null,id);
  return(p,id);
 }
 private async Task<IActionResult?> Active(){var(a,_)=await Actor();return a is null?Unauthorized(new{error="الحساب غير نشط أو انتهت صلاحيته"}):null;}
 private async Task<bool> Write(){var(a,_)=await Actor();return a is not null&&Writers.Contains(a.Role);}
 public record EntityInput(string Name,string? Code,string? ContactPoints);
 public record CompanyInput(string Name,string? CompanyType,string? ContactPoints);
 public record PlanInput(string Version,JsonElement PlanData,string? Status,DateOnly? ReceivedAt,string? SourceFile);
 public record NoteInput(Guid? ProjectId,string? EmployeeName,string? Category,string? ActionRequired,DateOnly? DueDate,string? Status,string? Notes,string? Priority,Guid? AssignedTo = null);

 [HttpGet("entities")]
 public async Task<IActionResult> Entities(){var d=await Active();if(d!=null)return d;var show=await Write();var rows=await db.GovernmentEntities.AsNoTracking().OrderBy(x=>x.Name).ToListAsync();return Ok(rows.Select(x=>new{id=x.Id,name=x.Name,code=x.Code,created_at=x.CreatedAt,contact_points=show?x.ContactPoints:"[]"}));}
 [HttpPost("entities")]
 public async Task<IActionResult> AddEntity(EntityInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest(new{error="اسم الجهة مطلوب"});var(_,uid)=await Actor();var now=DateTimeOffset.UtcNow;var row=new GovernmentEntity{Id=Guid.NewGuid(),Name=x.Name.Trim(),Code=x.Code,ContactPoints=SafeArray(x.ContactPoints),CreatedAt=now};db.GovernmentEntities.Add(row);db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="INSERT",TableName="government_entities",RecordId=row.Id.ToString(),NewData=JsonSerializer.Serialize(row),ChangedAt=now});await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("entities/{id:guid}")]
 public async Task<IActionResult> UpdateEntity(Guid id,EntityInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest(new{error="اسم الجهة مطلوب"});var row=await db.GovernmentEntities.FindAsync(id);if(row==null)return NotFound();var(_,uid)=await Actor();var old=JsonSerializer.Serialize(row);row.Name=x.Name.Trim();row.Code=x.Code;row.ContactPoints=SafeArray(x.ContactPoints);db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="UPDATE",TableName="government_entities",RecordId=row.Id.ToString(),OldData=old,NewData=JsonSerializer.Serialize(row),ChangedAt=DateTimeOffset.UtcNow});await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("companies")]
 public async Task<IActionResult> Companies(){var d=await Active();if(d!=null)return d;var show=await Write();var rows=await db.Companies.AsNoTracking().OrderBy(x=>x.Name).ToListAsync();return Ok(rows.Select(x=>new{id=x.Id,name=x.Name,company_type=x.CompanyType,created_at=x.CreatedAt,contact_points=show?x.ContactPoints:"[]"}));}
 [HttpPost("companies")]
 public async Task<IActionResult> AddCompany(CompanyInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest(new{error="اسم الشركة مطلوب"});var(_,uid)=await Actor();var now=DateTimeOffset.UtcNow;var row=new Company{Id=Guid.NewGuid(),Name=x.Name.Trim(),CompanyType=x.CompanyType,ContactPoints=SafeArray(x.ContactPoints),CreatedAt=now};db.Companies.Add(row);db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="INSERT",TableName="companies",RecordId=row.Id.ToString(),NewData=JsonSerializer.Serialize(row),ChangedAt=now});await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("companies/{id:guid}")]
 public async Task<IActionResult> UpdateCompany(Guid id,CompanyInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest(new{error="اسم الشركة مطلوب"});var row=await db.Companies.FindAsync(id);if(row==null)return NotFound();var(_,uid)=await Actor();var old=JsonSerializer.Serialize(row);row.Name=x.Name.Trim();row.CompanyType=x.CompanyType;row.ContactPoints=SafeArray(x.ContactPoints);db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="UPDATE",TableName="companies",RecordId=row.Id.ToString(),OldData=old,NewData=JsonSerializer.Serialize(row),ChangedAt=DateTimeOffset.UtcNow});await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("projects/{id:guid}/plans")]
 public async Task<IActionResult> Plans(Guid id){var d=await Active();if(d!=null)return d;if(!await db.Projects.AnyAsync(x=>x.Id==id))return NotFound();return Ok(await db.LocalContentPlans.AsNoTracking().Where(x=>x.ProjectId==id).OrderByDescending(x=>x.CreatedAt).ToListAsync());}
 [HttpPost("projects/{id:guid}/plans")]
 public async Task<IActionResult> AddPlan(Guid id,PlanInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(!await db.Projects.AnyAsync(p=>p.Id==id))return NotFound();if(string.IsNullOrWhiteSpace(x.Version)||x.PlanData.ValueKind!=JsonValueKind.Object)return BadRequest(new{error="رقم إصدار الخطة وبياناتها مطلوبان"});
 var(_,uid)=await Actor();var now=DateTimeOffset.UtcNow;
 var row=new LocalContentPlan{Id=Guid.NewGuid(),ProjectId=id,Version=x.Version.Trim(),PlanData=x.PlanData.GetRawText(),Status="received",ReceivedAt=x.ReceivedAt,SourceFile=x.SourceFile,CreatedBy=uid,CreatedAt=now};
 db.LocalContentPlans.Add(row);
 db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="INSERT",TableName="local_content_plans",RecordId=row.Id.ToString(),NewData=JsonSerializer.Serialize(row),ChangedAt=now});
 await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("plans/{id:guid}")]
 public async Task<IActionResult> UpdatePlan(Guid id,PlanInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.LocalContentPlans.FindAsync(id);if(row==null)return NotFound();if(string.IsNullOrWhiteSpace(x.Version)||x.PlanData.ValueKind!=JsonValueKind.Object)return BadRequest(new{error="رقم إصدار الخطة وبياناتها مطلوبان"});
 var(_,uid)=await Actor();var old=JsonSerializer.Serialize(row);row.Version=x.Version.Trim();row.PlanData=x.PlanData.GetRawText();row.ReceivedAt=x.ReceivedAt;row.SourceFile=x.SourceFile;
 db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="UPDATE",TableName="local_content_plans",RecordId=row.Id.ToString(),OldData=old,NewData=JsonSerializer.Serialize(row),ChangedAt=DateTimeOffset.UtcNow});
 await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("projects/{id:guid}/notes")]
 public async Task<IActionResult> Notes(Guid id){var d=await Active();if(d!=null)return d;return Ok(await db.EmployeeFollowups.AsNoTracking().Where(x=>x.ProjectId==id).OrderByDescending(x=>x.CreatedAt).ToListAsync());}
 [HttpPost("projects/{id:guid}/notes")]
 public async Task<IActionResult> AddNote(Guid id,NoteInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(!await db.Projects.AnyAsync(p=>p.Id==id))return NotFound();if(!ValidNote(x))return BadRequest(new{error="تحقق من حالة المتابعة والأولوية"});if(x.AssignedTo.HasValue&&!await db.UserProfiles.AnyAsync(u=>u.Id==x.AssignedTo.Value&&u.IsActive))return BadRequest(new{error="المستخدم المعيّن غير نشط أو غير موجود"});var(_,uid)=await Actor();var now=DateTimeOffset.UtcNow;var row=new EmployeeFollowup{Id=Guid.NewGuid(),ProjectId=id,EmployeeName=x.EmployeeName,Category=x.Category,ActionRequired=x.ActionRequired,DueDate=x.DueDate,Status=x.Status??"open",Notes=x.Notes,Priority=x.Priority??"متوسطة",AssignedTo=x.AssignedTo,CreatedBy=uid,CreatedAt=now,UpdatedAt=now};db.EmployeeFollowups.Add(row);db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="INSERT",TableName="employee_followups",RecordId=row.Id.ToString(),NewData=JsonSerializer.Serialize(row),ChangedAt=now});await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("notes/{id:guid}")]
 public async Task<IActionResult> UpdateNote(Guid id,NoteInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.EmployeeFollowups.FindAsync(id);if(row==null)return NotFound();if(!ValidNote(x))return BadRequest(new{error="تحقق من حالة المتابعة والأولوية"});if(x.AssignedTo.HasValue&&!await db.UserProfiles.AnyAsync(u=>u.Id==x.AssignedTo.Value&&u.IsActive))return BadRequest(new{error="المستخدم المعيّن غير نشط أو غير موجود"});var (actor,uid)=await Actor();var old=JsonSerializer.Serialize(row);var nextStatus=x.Status??row.Status;row.EmployeeName=x.EmployeeName;row.Category=x.Category;row.ActionRequired=x.ActionRequired;row.DueDate=x.DueDate;row.Status=nextStatus;row.Notes=x.Notes;row.Priority=x.Priority??row.Priority;row.AssignedTo=x.AssignedTo??row.AssignedTo;if(nextStatus=="closed"&&row.ResolvedAt is null){row.ResolvedAt=DateTimeOffset.UtcNow;row.ResolvedBy=uid;row.ResolvedByName=actor?.FullName;row.ResolutionNote=x.Notes;}else if(nextStatus=="open"){row.ResolvedAt=null;row.ResolvedBy=null;row.ResolvedByName=null;row.ResolutionNote=null;}row.UpdatedAt=DateTimeOffset.UtcNow;db.AuditEntries.Add(new AuditEntry{ActorUserId=uid,Operation="UPDATE",TableName="employee_followups",RecordId=row.Id.ToString(),OldData=old,NewData=JsonSerializer.Serialize(row),ChangedAt=row.UpdatedAt});await db.SaveChangesAsync();return Ok(row);}
 private static bool ValidNote(NoteInput x)=>(x.Status is null or "open" or "in_progress" or "closed")&&(x.Priority is null or "منخفضة" or "متوسطة" or "عالية" or "عاجلة");
 private static string SafeArray(string? value){if(string.IsNullOrWhiteSpace(value))return "[]";try{using var doc=JsonDocument.Parse(value);return doc.RootElement.ValueKind==JsonValueKind.Array?value:"[]";}catch{return "[]";}}
}

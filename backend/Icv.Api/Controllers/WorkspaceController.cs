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
 public record NoteInput(Guid? ProjectId,string? EmployeeName,string? Category,string? ActionRequired,DateOnly? DueDate,string? Status,string? Notes,string? Priority);

 [HttpGet("entities")]
 public async Task<IActionResult> Entities(){var d=await Active();if(d!=null)return d;return Ok(await db.GovernmentEntities.AsNoTracking().OrderBy(x=>x.Name).Select(x=>new{id=x.Id,name=x.Name,code=x.Code,created_at=x.CreatedAt,contact_points=Write()?x.ContactPoints:"[]"}).ToListAsync());}
 [HttpPost("entities")]
 public async Task<IActionResult> AddEntity(EntityInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest();var row=new GovernmentEntity{Id=Guid.NewGuid(),Name=x.Name.Trim(),Code=x.Code,ContactPoints=SafeArray(x.ContactPoints),CreatedAt=DateTimeOffset.UtcNow};db.GovernmentEntities.Add(row);await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("entities/{id:guid}")]
 public async Task<IActionResult> UpdateEntity(Guid id,EntityInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.GovernmentEntities.FindAsync(id);if(row==null)return NotFound();row.Name=x.Name.Trim();row.Code=x.Code;row.ContactPoints=SafeArray(x.ContactPoints);await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("companies")]
 public async Task<IActionResult> Companies(){var d=await Active();if(d!=null)return d;return Ok(await db.Companies.AsNoTracking().OrderBy(x=>x.Name).Select(x=>new{id=x.Id,name=x.Name,company_type=x.CompanyType,created_at=x.CreatedAt,contact_points=Write()?x.ContactPoints:"[]"}).ToListAsync());}
 [HttpPost("companies")]
 public async Task<IActionResult> AddCompany(CompanyInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(string.IsNullOrWhiteSpace(x.Name))return BadRequest();var row=new Company{Id=Guid.NewGuid(),Name=x.Name.Trim(),CompanyType=x.CompanyType,ContactPoints=SafeArray(x.ContactPoints),CreatedAt=DateTimeOffset.UtcNow};db.Companies.Add(row);await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("companies/{id:guid}")]
 public async Task<IActionResult> UpdateCompany(Guid id,CompanyInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.Companies.FindAsync(id);if(row==null)return NotFound();row.Name=x.Name.Trim();row.CompanyType=x.CompanyType;row.ContactPoints=SafeArray(x.ContactPoints);await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("projects/{id:guid}/plans")]
 public async Task<IActionResult> Plans(Guid id){var d=await Active();if(d!=null)return d;if(!await db.Projects.AnyAsync(x=>x.Id==id))return NotFound();return Ok(await db.LocalContentPlans.AsNoTracking().Where(x=>x.ProjectId==id).OrderByDescending(x=>x.CreatedAt).ToListAsync());}
 [HttpPost("projects/{id:guid}/plans")]
 public async Task<IActionResult> AddPlan(Guid id,PlanInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(!await db.Projects.AnyAsync(p=>p.Id==id))return NotFound();if(x.PlanData.ValueKind!=JsonValueKind.Object)return BadRequest(new{error="بيانات الخطة غير صالحة"});var(_,uid)=await Actor();var row=new LocalContentPlan{Id=Guid.NewGuid(),ProjectId=id,Version=x.Version,PlanData=x.PlanData.GetRawText(),Status=x.Status??"received",ReceivedAt=x.ReceivedAt,SourceFile=x.SourceFile,CreatedBy=uid,CreatedAt=DateTimeOffset.UtcNow};db.LocalContentPlans.Add(row);await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("plans/{id:guid}")]
 public async Task<IActionResult> UpdatePlan(Guid id,PlanInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.LocalContentPlans.FindAsync(id);if(row==null)return NotFound();if(x.PlanData.ValueKind!=JsonValueKind.Object)return BadRequest();row.Version=x.Version;row.PlanData=x.PlanData.GetRawText();row.Status=x.Status??row.Status;row.ReceivedAt=x.ReceivedAt;row.SourceFile=x.SourceFile;await db.SaveChangesAsync();return Ok(row);}
 [HttpGet("projects/{id:guid}/notes")]
 public async Task<IActionResult> Notes(Guid id){var d=await Active();if(d!=null)return d;return Ok(await db.EmployeeFollowups.AsNoTracking().Where(x=>x.ProjectId==id).OrderByDescending(x=>x.CreatedAt).ToListAsync());}
 [HttpPost("projects/{id:guid}/notes")]
 public async Task<IActionResult> AddNote(Guid id,NoteInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();if(!await db.Projects.AnyAsync(p=>p.Id==id))return NotFound();var(_,uid)=await Actor();var now=DateTimeOffset.UtcNow;var row=new EmployeeFollowup{Id=Guid.NewGuid(),ProjectId=id,EmployeeName=x.EmployeeName,Category=x.Category,ActionRequired=x.ActionRequired,DueDate=x.DueDate,Status=x.Status??"open",Notes=x.Notes,Priority=x.Priority??"متوسطة",CreatedBy=uid,CreatedAt=now,UpdatedAt=now};db.EmployeeFollowups.Add(row);await db.SaveChangesAsync();return Ok(row);}
 [HttpPut("notes/{id:guid}")]
 public async Task<IActionResult> UpdateNote(Guid id,NoteInput x){var d=await Active();if(d!=null)return d;if(!await Write())return Forbid();var row=await db.EmployeeFollowups.FindAsync(id);if(row==null)return NotFound();row.EmployeeName=x.EmployeeName;row.Category=x.Category;row.ActionRequired=x.ActionRequired;row.DueDate=x.DueDate;row.Status=x.Status??row.Status;row.Notes=x.Notes;row.Priority=x.Priority??row.Priority;row.UpdatedAt=DateTimeOffset.UtcNow;await db.SaveChangesAsync();return Ok(row);}
 private static string SafeArray(string? value){if(string.IsNullOrWhiteSpace(value))return "[]";try{using var doc=JsonDocument.Parse(value);return doc.RootElement.ValueKind==JsonValueKind.Array?value:"[]";}catch{return "[]";}}
}

using System.Text.Json;
using Icv.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Controllers;

[ApiController,Authorize,Route("api/files")]
public sealed class ReportFilesController(IcvIdentityDbContext db,UserManager<IdentityUser> users,IConfiguration config,IWebHostEnvironment env):ControllerBase
{
 private async Task<(UserProfile? profile,Guid? uid)> Actor(){var raw=users.GetUserId(User);if(!Guid.TryParse(raw,out var id))return(null,null);var p=await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==id);var now=DateTimeOffset.UtcNow;if(p==null||!p.IsActive||(p.AccessStartsAt.HasValue&&p.AccessStartsAt>now)||(p.AccessExpiresAt.HasValue&&p.AccessExpiresAt<=now))return(null,id);return(p,id);}
 private static bool Writer(string? role)=>role is "admin" or "section_head" or "editor";
 private string Root=>Path.GetFullPath(config["FileStorage:RootPath"]??Path.Combine(env.ContentRootPath,"App_Data","PrivateFiles"));
 [HttpPost("reports/{reportId:guid}")]
 [RequestSizeLimit(20*1024*1024)]
 public async Task<IActionResult> Upload(Guid reportId,IFormFile file){var(p,uid)=await Actor();if(p==null)return Unauthorized();if(!Writer(p.Role))return Forbid();if(file==null||file.Length==0||file.Length>20*1024*1024)return BadRequest(new{error="الملف فارغ أو يتجاوز 20 ميجابايت"});var report=await db.QuarterlyReports.SingleOrDefaultAsync(x=>x.Id==reportId);if(report==null)return NotFound();var ext=Path.GetExtension(Path.GetFileName(file.FileName));if(ext.Length>12)return BadRequest();var safeName=Guid.NewGuid().ToString("N")+ext.ToLowerInvariant();var folder=Path.Combine(Root,"reports",report.ProjectId.ToString("N"),report.Id.ToString("N"));Directory.CreateDirectory(folder);var full=Path.Combine(folder,safeName);await using(var stream=new FileStream(full,FileMode.CreateNew,FileAccess.Write,FileShare.None,81920,FileOptions.Asynchronous|FileOptions.WriteThrough)){await file.CopyToAsync(stream);}var data=JsonDocument.Parse(report.ReportData).RootElement.Clone();var dict=JsonSerializer.Deserialize<Dictionary<string,JsonElement>>(data.GetRawText())??new();dict["attachment_path"]=JsonSerializer.SerializeToElement($"reports/{report.ProjectId:N}/{report.Id:N}/{safeName}");dict["attachment_name"]=JsonSerializer.SerializeToElement(Path.GetFileName(file.FileName));dict["attachment_size"]=JsonSerializer.SerializeToElement(file.Length);report.ReportData=JsonSerializer.Serialize(dict);await db.SaveChangesAsync();return Ok(new{path=dict["attachment_path"].GetString(),name=Path.GetFileName(file.FileName),size=file.Length});}
 [HttpGet("{reportId:guid}/{fileName}")]
 public async Task<IActionResult> Download(Guid reportId,string fileName){var(p,_)=await Actor();if(p==null)return Unauthorized();var report=await db.QuarterlyReports.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==reportId);if(report==null)return NotFound();using var doc=JsonDocument.Parse(report.ReportData);if(!doc.RootElement.TryGetProperty("attachment_path",out var prop))return NotFound();var relative=prop.GetString()??"";var expected=$"reports/{report.ProjectId:N}/{report.Id:N}/";if(!relative.StartsWith(expected,StringComparison.Ordinal)||Path.GetFileName(relative)!=fileName)return NotFound();var full=Path.GetFullPath(Path.Combine(Root,relative.Replace('/',Path.DirectorySeparatorChar)));if(!full.StartsWith(Root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)||!System.IO.File.Exists(full))return NotFound();var name=doc.RootElement.TryGetProperty("attachment_name",out var n)?n.GetString()??fileName:fileName;return PhysicalFile(full,"application/octet-stream",Path.GetFileName(name));}
}

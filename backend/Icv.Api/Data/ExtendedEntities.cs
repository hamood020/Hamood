using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Icv.Api.Data;

[Table("government_entities")]
public sealed class GovernmentEntity {
 [Key,Column("id")] public Guid Id {get;set;}
 [Required,Column("name")] public string Name {get;set;}="";
 [Column("code")] public string? Code {get;set;}
 [Column("contact_points")] public string ContactPoints {get;set;}="[]";
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
}
[Table("companies")]
public sealed class Company {
 [Key,Column("id")] public Guid Id {get;set;}
 [Required,Column("name")] public string Name {get;set;}="";
 [Column("company_type")] public string? CompanyType {get;set;}
 [Column("contact_points")] public string ContactPoints {get;set;}="[]";
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
}
[Table("local_content_plans")]
public sealed class LocalContentPlan {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("project_id")] public Guid ProjectId {get;set;}
 [Required,Column("version")] public string Version {get;set;}="";
 [Column("source_file")] public string? SourceFile {get;set;}
 [Required,Column("plan_data")] public string PlanData {get;set;}="{}";
 [Column("received_at")] public DateOnly? ReceivedAt {get;set;}
 [Column("reviewed_at")] public DateOnly? ReviewedAt {get;set;}
 [Column("status")] public string Status {get;set;}="received";
 [Column("created_by")] public Guid? CreatedBy {get;set;}
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
}
[Table("employee_followups")]
public sealed class EmployeeFollowup {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("project_id")] public Guid? ProjectId {get;set;}
 [Column("employee_name")] public string? EmployeeName {get;set;}
 [Column("category")] public string? Category {get;set;}
 [Column("action_required")] public string? ActionRequired {get;set;}
 [Column("due_date")] public DateOnly? DueDate {get;set;}
 [Column("status")] public string Status {get;set;}="open";
 [Column("notes")] public string? Notes {get;set;}
 [Column("assigned_to")] public Guid? AssignedTo {get;set;}
 [Column("priority")] public string Priority {get;set;}="متوسطة";
 [Column("created_by")] public Guid? CreatedBy {get;set;}
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
 [Column("updated_at")] public DateTimeOffset UpdatedAt {get;set;}
}

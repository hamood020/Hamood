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


[Table("project_baselines")]
public sealed class ProjectBaseline {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("project_id")] public Guid ProjectId {get;set;}
 [Column("source_file")] public string? SourceFile {get;set;}
 [Required,Column("baseline_data")] public string BaselineData {get;set;}="{}";
 [Column("captured_at")] public DateTimeOffset CapturedAt {get;set;}
 [Column("created_by")] public Guid? CreatedBy {get;set;}
}
[Table("project_end_date_history")]
public sealed class ProjectEndDateHistory {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("project_id")] public Guid ProjectId {get;set;}
 [Column("old_end_date")] public DateOnly? OldEndDate {get;set;}
 [Column("new_end_date")] public DateOnly NewEndDate {get;set;}
 [Column("changed_by")] public Guid? ChangedBy {get;set;}
 [Column("changed_at")] public DateTimeOffset ChangedAt {get;set;}
 [Column("reason")] public string? Reason {get;set;}
}
[Table("project_plan_documents")]
public sealed class ProjectPlanDocument {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("project_id")] public Guid ProjectId {get;set;}
 [Column("plan_id")] public Guid? PlanId {get;set;}
 [Required,Column("display_name")] public string DisplayName {get;set;}="";
 [Required,Column("original_file_name")] public string OriginalFileName {get;set;}="";
 [Required,Column("storage_path")] public string StoragePath {get;set;}="";
 [Column("mime_type")] public string? MimeType {get;set;}
 [Column("file_size")] public long? FileSize {get;set;}
 [Column("created_by")] public Guid? CreatedBy {get;set;}
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
 [Column("updated_at")] public DateTimeOffset UpdatedAt {get;set;}
}
[Table("notifications")]
public sealed class Notification {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("user_id")] public Guid UserId {get;set;}
 [Required,Column("kind")] public string Kind {get;set;}="";
 [Required,Column("title")] public string Title {get;set;}="";
 [Column("body")] public string? Body {get;set;}
 [Column("project_id")] public Guid? ProjectId {get;set;}
 [Required,Column("dedupe_key")] public string DedupeKey {get;set;}="";
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
 [Column("read_at")] public DateTimeOffset? ReadAt {get;set;}
}
[Table("platform_settings")]
public sealed class PlatformSetting {
 [Key,Column("id")] public string Id {get;set;}="global";
 [Required,Column("settings")] public string Settings {get;set;}="{}";
 [Column("updated_by")] public Guid? UpdatedBy {get;set;}
 [Column("updated_at")] public DateTimeOffset UpdatedAt {get;set;}
}
[Table("user_entity_assignments")]
public sealed class UserEntityAssignment {
 [Key,Column("id")] public Guid Id {get;set;}
 [Column("user_id")] public Guid UserId {get;set;}
 [Column("government_entity_id")] public Guid GovernmentEntityId {get;set;}
 [Column("created_at")] public DateTimeOffset CreatedAt {get;set;}
}
[Table("user_notification_settings")]
public sealed class UserNotificationSettings {
 [Key,Column("user_id")] public Guid UserId {get;set;}
 [Column("report_due")] public bool ReportDue {get;set;}=true;
 [Column("project_expiry")] public bool ProjectExpiry {get;set;}=true;
 [Column("approval")] public bool Approval {get;set;}=true;
 [Column("delay")] public bool Delay {get;set;}=true;
 [Column("plan_update")] public bool PlanUpdate {get;set;}=true;
 [Column("days_before")] public int DaysBefore {get;set;}=10;
 [Column("updated_at")] public DateTimeOffset UpdatedAt {get;set;}
}

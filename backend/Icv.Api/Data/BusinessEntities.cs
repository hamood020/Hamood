using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Icv.Api.Data;

[Table("user_profiles")]
public sealed class UserProfile
{
    [Key, Column("id")] public Guid Id { get; set; }
    [Column("full_name")] public string? FullName { get; set; }
    [Column("role")] public string Role { get; set; } = "viewer";
    [Column("is_active")] public bool IsActive { get; set; }
    [Column("access_starts_at")] public DateTimeOffset? AccessStartsAt { get; set; }
    [Column("access_expires_at")] public DateTimeOffset? AccessExpiresAt { get; set; }
    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; }
    [Column("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    [Column("username")] public string? Username { get; set; }
}

[Table("projects")]
public sealed class Project
{
    [Key, Column("id")] public Guid Id { get; set; }
    [Column("serial_no")] public int? SerialNo { get; set; }
    [Column("government_entity_id")] public Guid? GovernmentEntityId { get; set; }
    [Required, Column("project_name")] public string ProjectName { get; set; } = "";
    [Column("tender_type")] public string? TenderType { get; set; }
    [Column("project_status")] public string? ProjectStatus { get; set; }
    [Column("consultant")] public string? Consultant { get; set; }
    [Column("implementing_company_id")] public Guid? ImplementingCompanyId { get; set; }
    [Column("work_sector")] public string? WorkSector { get; set; }
    [Column("total_project_value", TypeName="decimal(18,2)")] public decimal? TotalProjectValue { get; set; }
    [Column("start_date")] public DateOnly? StartDate { get; set; }
    [Column("end_date")] public DateOnly? EndDate { get; set; }
    [Column("original_end_date")] public DateOnly? OriginalEndDate { get; set; }
    [Column("local_content_plan")] public bool? LocalContentPlan { get; set; }
    [Column("notes")] public string? Notes { get; set; }
    [Required, Column("location")] public string Location { get; set; } = "{}";
    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; }
    [Column("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
}

[Table("quarterly_reports")]
public sealed class QuarterlyReport
{
    [Key, Column("id")] public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    [Required, Column("quarter")] public string Quarter { get; set; } = "";
    [Column("annual_period")] public string? AnnualPeriod { get; set; }
    [Column("source_file")] public string? SourceFile { get; set; }
    [Required, Column("report_data")] public string ReportData { get; set; } = "{}";
    [Column("status")] public string Status { get; set; } = "received";
    [Column("submitted_at")] public DateOnly? SubmittedAt { get; set; }
    [Column("reviewed_at")] public DateOnly? ReviewedAt { get; set; }
    [Column("notes")] public string? Notes { get; set; }
    [Column("created_by")] public Guid? CreatedBy { get; set; }
    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; }
}

[Table("audit_log")]
public sealed class AuditEntry
{
    [Key, Column("id")] public long Id { get; set; }
    [Column("actor_user_id")] public Guid? ActorUserId { get; set; }
    [Required, Column("operation")] public string Operation { get; set; } = "";
    [Required, Column("table_name")] public string TableName { get; set; } = "";
    [Column("record_id")] public string? RecordId { get; set; }
    [Column("old_data")] public string? OldData { get; set; }
    [Column("new_data")] public string? NewData { get; set; }
    [Column("changed_at")] public DateTimeOffset ChangedAt { get; set; }
}

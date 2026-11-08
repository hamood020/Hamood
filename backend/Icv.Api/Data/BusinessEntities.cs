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

    // Source-schema fields retained by Supabase and required for lossless project migration.
    [Column("progress_pct")] public decimal? ProgressPct { get; set; }
    [Column("target_reports")] public int? TargetReports { get; set; }
    [Column("due_reports")] public int? DueReports { get; set; }
    [Column("received_reports")] public int? ReceivedReports { get; set; }
    [Column("late_reports")] public int? LateReports { get; set; }
    [Column("current_quarter")] public string? CurrentQuarter { get; set; }
    [Column("annual_update")] public string? AnnualUpdate { get; set; }
    [Column("target_omani")] public int? TargetOmani { get; set; }
    [Column("current_omani")] public int? CurrentOmani { get; set; }
    [Column("achieved_omani")] public decimal? AchievedOmani { get; set; }
    [Column("non_omani")] public int? NonOmani { get; set; }
    [Column("omanization_pct")] public decimal? OmanizationPct { get; set; }
    [Column("target_non_omani")] public int? TargetNonOmani { get; set; }
    [Column("plan_omani_salary")] public decimal? PlanOmaniSalary { get; set; }
    [Column("actual_omani_salary")] public decimal? ActualOmaniSalary { get; set; }
    [Column("local_content_omani")] public decimal? LocalContentOmani { get; set; }
    [Column("plan_non_omani_salary")] public decimal? PlanNonOmaniSalary { get; set; }
    [Column("actual_non_omani_salary")] public decimal? ActualNonOmaniSalary { get; set; }
    [Column("local_content_non_omani")] public decimal? LocalContentNonOmani { get; set; }
    [Column("cat1_omani")] public int? Cat1Omani { get; set; }
    [Column("cat1_non_omani")] public int? Cat1NonOmani { get; set; }
    [Column("cat2_omani")] public int? Cat2Omani { get; set; }
    [Column("cat2_non_omani")] public int? Cat2NonOmani { get; set; }
    [Column("cat3_omani")] public int? Cat3Omani { get; set; }
    [Column("cat3_non_omani")] public int? Cat3NonOmani { get; set; }
    [Column("plan_made_in_oman")] public decimal? PlanMadeInOman { get; set; }
    [Column("actual_made_in_oman")] public decimal? ActualMadeInOman { get; set; }
    [Column("mandatory_made_in_oman")] public decimal? MandatoryMadeInOman { get; set; }
    [Column("made_in_oman_status")] public string? MadeInOmanStatus { get; set; }
    [Column("local_content_made_in_oman")] public decimal? LocalContentMadeInOman { get; set; }
    [Column("plan_local_supplier")] public decimal? PlanLocalSupplier { get; set; }
    [Column("actual_local_supplier")] public decimal? ActualLocalSupplier { get; set; }
    [Column("local_content_local_supplier")] public decimal? LocalContentLocalSupplier { get; set; }
    [Column("plan_direct_import")] public decimal? PlanDirectImport { get; set; }
    [Column("actual_direct_import")] public decimal? ActualDirectImport { get; set; }
    [Column("local_content_direct_import")] public decimal? LocalContentDirectImport { get; set; }
    [Column("plan_sme_supplier")] public decimal? PlanSmeSupplier { get; set; }
    [Column("actual_sme_supplier")] public decimal? ActualSmeSupplier { get; set; }
    [Column("local_content_sme_supplier")] public decimal? LocalContentSmeSupplier { get; set; }
    [Column("plan_local_service")] public decimal? PlanLocalService { get; set; }
    [Column("actual_local_service")] public decimal? ActualLocalService { get; set; }
    [Column("local_content_local_service")] public decimal? LocalContentLocalService { get; set; }
    [Column("plan_foreign_service")] public decimal? PlanForeignService { get; set; }
    [Column("actual_foreign_service")] public decimal? ActualForeignService { get; set; }
    [Column("local_content_foreign_service")] public decimal? LocalContentForeignService { get; set; }
    [Column("plan_sme_service")] public decimal? PlanSmeService { get; set; }
    [Column("actual_sme_service")] public decimal? ActualSmeService { get; set; }
    [Column("sme_10_status")] public string? Sme10Status { get; set; }
    [Column("local_content_sme_service")] public decimal? LocalContentSmeService { get; set; }
    [Column("total_spend")] public decimal? TotalSpend { get; set; }
    [Column("total_local_content")] public decimal? TotalLocalContent { get; set; }
    [Column("local_content_spend_pct")] public decimal? LocalContentSpendPct { get; set; }
    [Column("local_content_project_pct")] public decimal? LocalContentProjectPct { get; set; }
    [Column("sme_pct")] public decimal? SmePct { get; set; }
    [Column("goods_pct")] public decimal? GoodsPct { get; set; }
    [Column("services_pct")] public decimal? ServicesPct { get; set; }
    [Column("omanization_status")] public string? OmanizationStatus { get; set; }
    [Column("services_status")] public string? ServicesStatus { get; set; }
    [Column("compliance_status")] public string? ComplianceStatus { get; set; }
    [Column("actual_subcontract_local")] public decimal? ActualSubcontractLocal { get; set; }
    [Column("actual_subcontract_foreign")] public decimal? ActualSubcontractForeign { get; set; }
    [Column("actual_subcontract_sme")] public decimal? ActualSubcontractSme { get; set; }
    [Column("metrics_updated_at")] public DateTimeOffset? MetricsUpdatedAt { get; set; }

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

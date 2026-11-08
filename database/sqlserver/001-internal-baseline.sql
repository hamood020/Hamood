/*
  ICV Internal SQL Server baseline
  Derived from docs/schema-baseline-2026-10-20.sql (PostgreSQL reference snapshot).
  Run ONLY against a newly-created staging database. Never run against Supabase or production.
  Identity users are stored separately in AspNetUsers; user_profiles.id stores the same GUID value.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE dbo.companies (
 id uniqueidentifier NOT NULL CONSTRAINT PK_companies PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 name nvarchar(300) NOT NULL, company_type nvarchar(100) NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_companies_created DEFAULT SYSDATETIMEOFFSET(),
 contact_points nvarchar(max) NOT NULL CONSTRAINT DF_companies_contacts DEFAULT N'[]',
 CONSTRAINT UQ_companies_name UNIQUE(name), CONSTRAINT CK_companies_contacts CHECK(ISJSON(contact_points)=1 AND LEFT(LTRIM(contact_points),1)=N'[')
);
CREATE TABLE dbo.government_entities (
 id uniqueidentifier NOT NULL CONSTRAINT PK_government_entities PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 name nvarchar(300) NOT NULL, code nvarchar(100) NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_entities_created DEFAULT SYSDATETIMEOFFSET(),
 contact_points nvarchar(max) NOT NULL CONSTRAINT DF_entities_contacts DEFAULT N'[]',
 CONSTRAINT UQ_government_entities_name UNIQUE(name),
 CONSTRAINT CK_entities_contacts CHECK(ISJSON(contact_points)=1 AND LEFT(LTRIM(contact_points),1)=N'[')
);
CREATE TABLE dbo.user_profiles (
 id uniqueidentifier NOT NULL CONSTRAINT PK_user_profiles PRIMARY KEY,
 full_name nvarchar(300) NULL, role nvarchar(40) NOT NULL CONSTRAINT DF_profiles_role DEFAULT N'viewer',
 is_active bit NOT NULL CONSTRAINT DF_profiles_active DEFAULT 0,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_profiles_created DEFAULT SYSDATETIMEOFFSET(),
 updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_profiles_updated DEFAULT SYSDATETIMEOFFSET(),
 username nvarchar(256) NULL, access_starts_at datetimeoffset(0) NULL, access_expires_at datetimeoffset(0) NULL,
 CONSTRAINT CK_profiles_role CHECK(role IN(N'admin',N'section_head',N'editor',N'viewer',N'temporary_viewer'))
);
CREATE TABLE dbo.projects (
 id uniqueidentifier NOT NULL CONSTRAINT PK_projects PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 serial_no int NULL, government_entity_id uniqueidentifier NULL, project_name nvarchar(500) NOT NULL,
 tender_type nvarchar(150) NULL, project_status nvarchar(100) NULL, consultant nvarchar(300) NULL,
 implementing_company_id uniqueidentifier NULL, work_sector nvarchar(200) NULL,
 total_project_value decimal(18,2) NULL, start_date date NULL, end_date date NULL,
 local_content_plan bit NULL, progress_pct decimal(7,4) NULL, target_reports int NULL, due_reports int NULL,
 received_reports int NULL, late_reports int NULL, current_quarter nvarchar(50) NULL, annual_update nvarchar(100) NULL,
 target_omani int NULL, current_omani int NULL, achieved_omani decimal(12,4) NULL, non_omani int NULL,
 omanization_pct decimal(9,6) NULL, target_non_omani int NULL,
 plan_omani_salary decimal(18,2) NULL, actual_omani_salary decimal(18,2) NULL, local_content_omani decimal(18,2) NULL,
 plan_non_omani_salary decimal(18,2) NULL, actual_non_omani_salary decimal(18,2) NULL, local_content_non_omani decimal(18,2) NULL,
 cat1_omani int NULL, cat1_non_omani int NULL, cat2_omani int NULL, cat2_non_omani int NULL, cat3_omani int NULL, cat3_non_omani int NULL,
 plan_made_in_oman decimal(18,2) NULL, actual_made_in_oman decimal(18,2) NULL, mandatory_made_in_oman decimal(18,2) NULL,
 made_in_oman_status nvarchar(100) NULL, local_content_made_in_oman decimal(18,2) NULL,
 plan_local_supplier decimal(18,2) NULL, actual_local_supplier decimal(18,2) NULL, local_content_local_supplier decimal(18,2) NULL,
 plan_direct_import decimal(18,2) NULL, actual_direct_import decimal(18,2) NULL, local_content_direct_import decimal(18,2) NULL,
 plan_sme_supplier decimal(18,2) NULL, actual_sme_supplier decimal(18,2) NULL, local_content_sme_supplier decimal(18,2) NULL,
 plan_local_service decimal(18,2) NULL, actual_local_service decimal(18,2) NULL, local_content_local_service decimal(18,2) NULL,
 plan_foreign_service decimal(18,2) NULL, actual_foreign_service decimal(18,2) NULL, local_content_foreign_service decimal(18,2) NULL,
 plan_sme_service decimal(18,2) NULL, actual_sme_service decimal(18,2) NULL, sme_10_status nvarchar(100) NULL,
 local_content_sme_service decimal(18,2) NULL, total_spend decimal(18,2) NULL, total_local_content decimal(18,2) NULL,
 local_content_spend_pct decimal(9,6) NULL, local_content_project_pct decimal(9,6) NULL, sme_pct decimal(9,6) NULL,
 notes nvarchar(max) NULL, created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_projects_created DEFAULT SYSDATETIMEOFFSET(),
 updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_projects_updated DEFAULT SYSDATETIMEOFFSET(),
 original_end_date date NULL, goods_pct decimal(9,6) NULL, services_pct decimal(9,6) NULL,
 omanization_status nvarchar(100) NULL, services_status nvarchar(100) NULL, compliance_status nvarchar(100) NULL,
 actual_subcontract_local decimal(18,2) NULL, actual_subcontract_foreign decimal(18,2) NULL, actual_subcontract_sme decimal(18,2) NULL,
 metrics_updated_at datetimeoffset(0) NULL,
 location nvarchar(max) NOT NULL CONSTRAINT DF_projects_location DEFAULT N'{}',
 CONSTRAINT CK_projects_location CHECK(ISJSON(location)=1),
 CONSTRAINT FK_projects_entity FOREIGN KEY(government_entity_id) REFERENCES dbo.government_entities(id),
 CONSTRAINT FK_projects_company FOREIGN KEY(implementing_company_id) REFERENCES dbo.companies(id)
);
CREATE INDEX IX_projects_entity ON dbo.projects(government_entity_id);
CREATE INDEX IX_projects_company ON dbo.projects(implementing_company_id);
CREATE INDEX IX_projects_serial ON dbo.projects(serial_no);
CREATE TABLE dbo.quarterly_reports (
 id uniqueidentifier NOT NULL CONSTRAINT PK_quarterly_reports PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NOT NULL, quarter nvarchar(40) NOT NULL, annual_period nvarchar(20) NULL,
 source_file nvarchar(500) NULL, report_data nvarchar(max) NOT NULL CONSTRAINT DF_reports_data DEFAULT N'{}',
 status nvarchar(40) NOT NULL CONSTRAINT DF_reports_status DEFAULT N'received',
 submitted_at date NULL, reviewed_at date NULL, notes nvarchar(max) NULL,
 created_by uniqueidentifier NULL, created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_reports_created DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT FK_reports_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT CK_reports_json CHECK(ISJSON(report_data)=1)
);
CREATE INDEX IX_reports_project_period ON dbo.quarterly_reports(project_id,annual_period,quarter);
CREATE TABLE dbo.local_content_plans (
 id uniqueidentifier NOT NULL CONSTRAINT PK_local_content_plans PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NOT NULL, version nvarchar(100) NOT NULL, source_file nvarchar(500) NULL,
 plan_data nvarchar(max) NOT NULL CONSTRAINT DF_plans_data DEFAULT N'{}', received_at date NULL, reviewed_at date NULL,
 status nvarchar(40) NOT NULL CONSTRAINT DF_plans_status DEFAULT N'received', created_by uniqueidentifier NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_plans_created DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT FK_plans_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT CK_plans_json CHECK(ISJSON(plan_data)=1)
);
CREATE TABLE dbo.project_end_date_history (
 id uniqueidentifier NOT NULL CONSTRAINT PK_project_end_date_history PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NOT NULL, old_end_date date NULL, new_end_date date NOT NULL,
 changed_by uniqueidentifier NULL, changed_at datetimeoffset(0) NOT NULL CONSTRAINT DF_endhistory_changed DEFAULT SYSDATETIMEOFFSET(),
 reason nvarchar(1000) NULL,
 CONSTRAINT FK_endhistory_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE
);
CREATE TABLE dbo.project_baselines (
 id uniqueidentifier NOT NULL CONSTRAINT PK_project_baselines PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NOT NULL, source_file nvarchar(500) NULL,
 baseline_data nvarchar(max) NOT NULL CONSTRAINT DF_baselines_data DEFAULT N'{}',
 captured_at datetimeoffset(0) NOT NULL CONSTRAINT DF_baselines_captured DEFAULT SYSDATETIMEOFFSET(),
 created_by uniqueidentifier NULL, CONSTRAINT UQ_baselines_project UNIQUE(project_id),
 CONSTRAINT FK_baselines_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT CK_baselines_json CHECK(ISJSON(baseline_data)=1)
);
CREATE TABLE dbo.project_plan_documents (
 id uniqueidentifier NOT NULL CONSTRAINT PK_project_plan_documents PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NOT NULL, plan_id uniqueidentifier NULL, display_name nvarchar(300) NOT NULL,
 original_file_name nvarchar(500) NOT NULL, storage_path nvarchar(1000) NOT NULL, mime_type nvarchar(150) NULL,
 file_size bigint NULL, created_by uniqueidentifier NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_plandocs_created DEFAULT SYSDATETIMEOFFSET(),
 updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_plandocs_updated DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT FK_plandocs_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT FK_plandocs_plan FOREIGN KEY(plan_id) REFERENCES dbo.local_content_plans(id)
);
CREATE TABLE dbo.employee_followups (
 id uniqueidentifier NOT NULL CONSTRAINT PK_employee_followups PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 project_id uniqueidentifier NULL, employee_name nvarchar(300) NULL, category nvarchar(200) NULL,
 action_required nvarchar(max) NULL, due_date date NULL, status nvarchar(30) NOT NULL CONSTRAINT DF_followups_status DEFAULT N'open',
 notes nvarchar(max) NULL, assigned_to uniqueidentifier NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_followups_created DEFAULT SYSDATETIMEOFFSET(),
 updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_followups_updated DEFAULT SYSDATETIMEOFFSET(),
 priority nvarchar(30) NOT NULL CONSTRAINT DF_followups_priority DEFAULT N'متوسطة',
 created_by uniqueidentifier NULL, resolved_at datetimeoffset(0) NULL, resolved_by uniqueidentifier NULL,
 resolution_note nvarchar(max) NULL, resolved_by_name nvarchar(300) NULL,
 CONSTRAINT FK_followups_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT CK_followups_status CHECK(status IN(N'open',N'closed')),
 CONSTRAINT CK_followups_priority CHECK(priority IN(N'منخفضة',N'متوسطة',N'عالية',N'عاجلة'))
);
CREATE TABLE dbo.notifications (
 id uniqueidentifier NOT NULL CONSTRAINT PK_notifications PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 user_id uniqueidentifier NOT NULL, kind nvarchar(50) NOT NULL, title nvarchar(300) NOT NULL,
 body nvarchar(max) NULL, project_id uniqueidentifier NULL, dedupe_key nvarchar(300) NOT NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_notifications_created DEFAULT SYSDATETIMEOFFSET(),
 read_at datetimeoffset(0) NULL,
 CONSTRAINT UQ_notifications_user_dedupe UNIQUE(user_id,dedupe_key),
 CONSTRAINT FK_notifications_project FOREIGN KEY(project_id) REFERENCES dbo.projects(id) ON DELETE CASCADE,
 CONSTRAINT CK_notifications_kind CHECK(kind IN(N'report_due',N'delay',N'project_expiry',N'approval',N'plan_update'))
);
CREATE TABLE dbo.user_entity_assignments (
 id uniqueidentifier NOT NULL CONSTRAINT PK_user_entity_assignments PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
 user_id uniqueidentifier NOT NULL, government_entity_id uniqueidentifier NOT NULL,
 created_at datetimeoffset(0) NOT NULL CONSTRAINT DF_assignments_created DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT UQ_assignments UNIQUE(user_id,government_entity_id),
 CONSTRAINT FK_assignments_entity FOREIGN KEY(government_entity_id) REFERENCES dbo.government_entities(id) ON DELETE CASCADE
);
CREATE TABLE dbo.user_notification_settings (
 user_id uniqueidentifier NOT NULL CONSTRAINT PK_user_notification_settings PRIMARY KEY,
 report_due bit NOT NULL CONSTRAINT DF_notify_report DEFAULT 1,
 project_expiry bit NOT NULL CONSTRAINT DF_notify_expiry DEFAULT 1,
 approval bit NOT NULL CONSTRAINT DF_notify_approval DEFAULT 1,
 delay bit NOT NULL CONSTRAINT DF_notify_delay DEFAULT 1,
 plan_update bit NOT NULL CONSTRAINT DF_notify_plan DEFAULT 1,
 days_before int NOT NULL CONSTRAINT DF_notify_days DEFAULT 10,
 updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_notify_updated DEFAULT SYSDATETIMEOFFSET()
);
CREATE TABLE dbo.platform_settings (
 id nvarchar(100) NOT NULL CONSTRAINT PK_platform_settings PRIMARY KEY CONSTRAINT DF_settings_id DEFAULT N'global',
 settings nvarchar(max) NOT NULL CONSTRAINT DF_settings_json DEFAULT N'{}',
 updated_by uniqueidentifier NULL, updated_at datetimeoffset(0) NOT NULL CONSTRAINT DF_settings_updated DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT CK_settings_id CHECK(id=N'global'), CONSTRAINT CK_settings_json CHECK(ISJSON(settings)=1)
);
CREATE TABLE dbo.audit_log (
 id bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_log PRIMARY KEY,
 actor_user_id uniqueidentifier NULL, operation nvarchar(100) NOT NULL, table_name nvarchar(200) NOT NULL,
 record_id nvarchar(200) NULL, old_data nvarchar(max) NULL, new_data nvarchar(max) NULL,
 changed_at datetimeoffset(0) NOT NULL CONSTRAINT DF_audit_changed DEFAULT SYSDATETIMEOFFSET(),
 CONSTRAINT CK_audit_old_json CHECK(old_data IS NULL OR ISJSON(old_data)=1),
 CONSTRAINT CK_audit_new_json CHECK(new_data IS NULL OR ISJSON(new_data)=1)
);


/* ASP.NET Core Identity tables. IDs are GUID-formatted strings to match the
   current IdentityUser<string> implementation. Migration must preserve the
   GUID text value for each corresponding user_profiles.id. */
CREATE TABLE dbo.AspNetRoles (
 Id nvarchar(450) NOT NULL CONSTRAINT PK_AspNetRoles PRIMARY KEY,
 Name nvarchar(256) NULL, NormalizedName nvarchar(256) NULL,
 CONCURRENCYSTAMP nvarchar(max) NULL
);
CREATE UNIQUE INDEX RoleNameIndex ON dbo.AspNetRoles(NormalizedName) WHERE NormalizedName IS NOT NULL;
CREATE TABLE dbo.AspNetUsers (
 Id nvarchar(450) NOT NULL CONSTRAINT PK_AspNetUsers PRIMARY KEY,
 UserName nvarchar(256) NULL, NormalizedUserName nvarchar(256) NULL,
 Email nvarchar(256) NULL, NormalizedEmail nvarchar(256) NULL,
 EmailConfirmed bit NOT NULL, PasswordHash nvarchar(max) NULL,
 SecurityStamp nvarchar(max) NULL, ConcurrencyStamp nvarchar(max) NULL,
 PhoneNumber nvarchar(max) NULL, PhoneNumberConfirmed bit NOT NULL,
 TwoFactorEnabled bit NOT NULL, LockoutEnd datetimeoffset(7) NULL,
 LockoutEnabled bit NOT NULL, AccessFailedCount int NOT NULL
);
CREATE INDEX EmailIndex ON dbo.AspNetUsers(NormalizedEmail);
CREATE UNIQUE INDEX UserNameIndex ON dbo.AspNetUsers(NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;
CREATE TABLE dbo.AspNetUserClaims (
 Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AspNetUserClaims PRIMARY KEY,
 UserId nvarchar(450) NOT NULL, ClaimType nvarchar(max) NULL, ClaimValue nvarchar(max) NULL,
 CONSTRAINT FK_AspNetUserClaims_AspNetUsers FOREIGN KEY(UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
);
CREATE INDEX IX_AspNetUserClaims_UserId ON dbo.AspNetUserClaims(UserId);
CREATE TABLE dbo.AspNetRoleClaims (
 Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AspNetRoleClaims PRIMARY KEY,
 RoleId nvarchar(450) NOT NULL, ClaimType nvarchar(max) NULL, ClaimValue nvarchar(max) NULL,
 CONSTRAINT FK_AspNetRoleClaims_AspNetRoles FOREIGN KEY(RoleId) REFERENCES dbo.AspNetRoles(Id) ON DELETE CASCADE
);
CREATE INDEX IX_AspNetRoleClaims_RoleId ON dbo.AspNetRoleClaims(RoleId);
CREATE TABLE dbo.AspNetUserLogins (
 LoginProvider nvarchar(450) NOT NULL, ProviderKey nvarchar(450) NOT NULL,
 ProviderDisplayName nvarchar(max) NULL, UserId nvarchar(450) NOT NULL,
 CONSTRAINT PK_AspNetUserLogins PRIMARY KEY(LoginProvider,ProviderKey),
 CONSTRAINT FK_AspNetUserLogins_AspNetUsers FOREIGN KEY(UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
);
CREATE INDEX IX_AspNetUserLogins_UserId ON dbo.AspNetUserLogins(UserId);
CREATE TABLE dbo.AspNetUserRoles (
 UserId nvarchar(450) NOT NULL, RoleId nvarchar(450) NOT NULL,
 CONSTRAINT PK_AspNetUserRoles PRIMARY KEY(UserId,RoleId),
 CONSTRAINT FK_AspNetUserRoles_AspNetUsers FOREIGN KEY(UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE,
 CONSTRAINT FK_AspNetUserRoles_AspNetRoles FOREIGN KEY(RoleId) REFERENCES dbo.AspNetRoles(Id) ON DELETE CASCADE
);
CREATE INDEX IX_AspNetUserRoles_RoleId ON dbo.AspNetUserRoles(RoleId);
CREATE TABLE dbo.AspNetUserTokens (
 UserId nvarchar(450) NOT NULL, LoginProvider nvarchar(450) NOT NULL,
 Name nvarchar(450) NOT NULL, Value nvarchar(max) NULL,
 CONSTRAINT PK_AspNetUserTokens PRIMARY KEY(UserId,LoginProvider,Name),
 CONSTRAINT FK_AspNetUserTokens_AspNetUsers FOREIGN KEY(UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
);

/* Referential integrity for profile-backed user references. Auth identities
   are represented by the same GUID in user_profiles; passwords are migrated
   separately through a supported reset/provisioning flow. */
ALTER TABLE dbo.user_entity_assignments ADD CONSTRAINT FK_assignments_profile
 FOREIGN KEY(user_id) REFERENCES dbo.user_profiles(id) ON DELETE CASCADE;
ALTER TABLE dbo.user_notification_settings ADD CONSTRAINT FK_notify_profile
 FOREIGN KEY(user_id) REFERENCES dbo.user_profiles(id) ON DELETE CASCADE;
ALTER TABLE dbo.notifications ADD CONSTRAINT FK_notifications_profile
 FOREIGN KEY(user_id) REFERENCES dbo.user_profiles(id) ON DELETE CASCADE;
ALTER TABLE dbo.local_content_plans ADD CONSTRAINT FK_plans_creator_profile
 FOREIGN KEY(created_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.project_baselines ADD CONSTRAINT FK_baselines_creator_profile
 FOREIGN KEY(created_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.quarterly_reports ADD CONSTRAINT FK_reports_creator_profile
 FOREIGN KEY(created_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.project_plan_documents ADD CONSTRAINT FK_plandocs_creator_profile
 FOREIGN KEY(created_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.employee_followups ADD CONSTRAINT FK_followups_assigned_profile
 FOREIGN KEY(assigned_to) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.employee_followups ADD CONSTRAINT FK_followups_creator_profile
 FOREIGN KEY(created_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.employee_followups ADD CONSTRAINT FK_followups_resolved_profile
 FOREIGN KEY(resolved_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.project_end_date_history ADD CONSTRAINT FK_endhistory_profile
 FOREIGN KEY(changed_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.platform_settings ADD CONSTRAINT FK_settings_profile
 FOREIGN KEY(updated_by) REFERENCES dbo.user_profiles(id);
ALTER TABLE dbo.audit_log ADD CONSTRAINT FK_audit_profile
 FOREIGN KEY(actor_user_id) REFERENCES dbo.user_profiles(id);

ALTER TABLE dbo.user_notification_settings ADD CONSTRAINT CK_notify_days
 CHECK(days_before BETWEEN 0 AND 365);
ALTER TABLE dbo.project_plan_documents ADD CONSTRAINT UQ_plandocs_storage_path UNIQUE(storage_path);

COMMIT TRANSACTION;

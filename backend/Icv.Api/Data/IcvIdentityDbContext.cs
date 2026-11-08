using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Data;

public sealed class IcvIdentityDbContext(DbContextOptions<IcvIdentityDbContext> options)
    : IdentityDbContext<IdentityUser, IdentityRole, string>(options)
{
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<QuarterlyReport> QuarterlyReports => Set<QuarterlyReport>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<GovernmentEntity> GovernmentEntities => Set<GovernmentEntity>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<LocalContentPlan> LocalContentPlans => Set<LocalContentPlan>();
    public DbSet<EmployeeFollowup> EmployeeFollowups => Set<EmployeeFollowup>();
    public DbSet<ProjectBaseline> ProjectBaselines => Set<ProjectBaseline>();
    public DbSet<ProjectEndDateHistory> ProjectEndDateHistory => Set<ProjectEndDateHistory>();
    public DbSet<ProjectPlanDocument> ProjectPlanDocuments => Set<ProjectPlanDocument>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
    public DbSet<UserEntityAssignment> UserEntityAssignments => Set<UserEntityAssignment>();
    public DbSet<UserNotificationSettings> UserNotificationSettings => Set<UserNotificationSettings>();
    public DbSet<ProjectEndDateHistory> ProjectEndDateHistories => Set<ProjectEndDateHistory>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);


        // Match the SQL Server baseline precision exactly. This prevents EF from
        // generating incompatible parameter precision or future migrations.
        var project = builder.Entity<Project>();
        project.Property(x => x.TotalProjectValue).HasPrecision(18, 2);
        project.Property(x => x.ProgressPct).HasPrecision(7, 4);
        project.Property(x => x.AchievedOmani).HasPrecision(12, 4);
        project.Property(x => x.OmanizationPct).HasPrecision(9, 6);
        project.Property(x => x.PlanOmaniSalary).HasPrecision(18, 2);
        project.Property(x => x.ActualOmaniSalary).HasPrecision(18, 2);
        project.Property(x => x.LocalContentOmani).HasPrecision(18, 2);
        project.Property(x => x.PlanNonOmaniSalary).HasPrecision(18, 2);
        project.Property(x => x.ActualNonOmaniSalary).HasPrecision(18, 2);
        project.Property(x => x.LocalContentNonOmani).HasPrecision(18, 2);
        project.Property(x => x.PlanMadeInOman).HasPrecision(18, 2);
        project.Property(x => x.ActualMadeInOman).HasPrecision(18, 2);
        project.Property(x => x.MandatoryMadeInOman).HasPrecision(18, 2);
        project.Property(x => x.LocalContentMadeInOman).HasPrecision(18, 2);
        project.Property(x => x.PlanLocalSupplier).HasPrecision(18, 2);
        project.Property(x => x.ActualLocalSupplier).HasPrecision(18, 2);
        project.Property(x => x.LocalContentLocalSupplier).HasPrecision(18, 2);
        project.Property(x => x.PlanDirectImport).HasPrecision(18, 2);
        project.Property(x => x.ActualDirectImport).HasPrecision(18, 2);
        project.Property(x => x.LocalContentDirectImport).HasPrecision(18, 2);
        project.Property(x => x.PlanSmeSupplier).HasPrecision(18, 2);
        project.Property(x => x.ActualSmeSupplier).HasPrecision(18, 2);
        project.Property(x => x.LocalContentSmeSupplier).HasPrecision(18, 2);
        project.Property(x => x.PlanLocalService).HasPrecision(18, 2);
        project.Property(x => x.ActualLocalService).HasPrecision(18, 2);
        project.Property(x => x.LocalContentLocalService).HasPrecision(18, 2);
        project.Property(x => x.PlanForeignService).HasPrecision(18, 2);
        project.Property(x => x.ActualForeignService).HasPrecision(18, 2);
        project.Property(x => x.LocalContentForeignService).HasPrecision(18, 2);
        project.Property(x => x.PlanSmeService).HasPrecision(18, 2);
        project.Property(x => x.ActualSmeService).HasPrecision(18, 2);
        project.Property(x => x.LocalContentSmeService).HasPrecision(18, 2);
        project.Property(x => x.TotalSpend).HasPrecision(18, 2);
        project.Property(x => x.TotalLocalContent).HasPrecision(18, 2);
        project.Property(x => x.LocalContentSpendPct).HasPrecision(9, 6);
        project.Property(x => x.LocalContentProjectPct).HasPrecision(9, 6);
        project.Property(x => x.SmePct).HasPrecision(9, 6);
        project.Property(x => x.GoodsPct).HasPrecision(9, 6);
        project.Property(x => x.ServicesPct).HasPrecision(9, 6);
        project.Property(x => x.ActualSubcontractLocal).HasPrecision(18, 2);
        project.Property(x => x.ActualSubcontractForeign).HasPrecision(18, 2);
        project.Property(x => x.ActualSubcontractSme).HasPrecision(18, 2);

        // Baseline uses datetimeoffset(0); keep EF's model aligned.
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties()
                         .Where(p => p.ClrType == typeof(DateTimeOffset) ||
                                     p.ClrType == typeof(DateTimeOffset?)))
            {
                property.SetColumnType("datetimeoffset(0)");
            }
        }

        // Explicit names make the SQL Server identity schema predictable for IT deployment.
        builder.Entity<IdentityUser>().ToTable("AspNetUsers");
        builder.Entity<IdentityRole>().ToTable("AspNetRoles");
        builder.Entity<IdentityUserRole<string>>().ToTable("AspNetUserRoles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("AspNetUserClaims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("AspNetUserLogins");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("AspNetRoleClaims");
        builder.Entity<IdentityUserToken<string>>().ToTable("AspNetUserTokens");
    }
}
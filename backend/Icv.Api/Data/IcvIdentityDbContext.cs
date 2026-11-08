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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

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
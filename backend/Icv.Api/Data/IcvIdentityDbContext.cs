using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Icv.Api.Data;

public sealed class IcvIdentityDbContext(DbContextOptions<IcvIdentityDbContext> options)
    : IdentityDbContext<IdentityUser, IdentityRole, string>(options)
{
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
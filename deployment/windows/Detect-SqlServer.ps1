[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ServerInstance,

    [string]$Database = "master"
)

$ErrorActionPreference = "Stop"

$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    throw "sqlcmd was not found. Install the approved Microsoft SQL command-line tools or run the version query through your DBA workstation."
}

$query = @"
SET NOCOUNT ON;
SELECT
    CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(128)) AS ProductVersion,
    CAST(SERVERPROPERTY('ProductLevel') AS nvarchar(128)) AS ProductLevel,
    CAST(SERVERPROPERTY('Edition') AS nvarchar(256)) AS Edition,
    CAST(SERVERPROPERTY('EngineEdition') AS int) AS EngineEdition,
    CAST(SERVERPROPERTY('Collation') AS nvarchar(128)) AS ServerCollation,
    d.compatibility_level AS DatabaseCompatibilityLevel,
    d.collation_name AS DatabaseCollation
FROM sys.databases AS d
WHERE d.name = DB_NAME();
"@

Write-Host "Checking SQL Server instance: $ServerInstance"
Write-Host "Database context: $Database"
Write-Host "No database changes will be made."

& $sqlcmd.Source -S $ServerInstance -d $Database -E -W -s "|" -Q $query
if ($LASTEXITCODE -ne 0) {
    throw "SQL Server detection failed. Check VPN access, instance name, Windows authentication, and permissions."
}

/*
  Upgrade existing ICV staging databases to support in-progress follow-ups.
  Safe for existing rows whose status is open or closed.
  Run only against the isolated local/staging SQL Server database.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.CK_followups_status', N'C') IS NOT NULL
    ALTER TABLE dbo.employee_followups DROP CONSTRAINT CK_followups_status;

ALTER TABLE dbo.employee_followups
    ADD CONSTRAINT CK_followups_status
    CHECK (status IN (N'open', N'in_progress', N'closed'));

COMMIT TRANSACTION;

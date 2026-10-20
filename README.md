# متابعة المحتوى المحلي (ICV)

Static site (GitHub Pages) backed by Supabase project `bmwtrnosqosbkezdswcx`.

- `public/` — the only folder published to GitHub Pages (`.github/workflows/pages.yml`).
- `supabase/migrations/` — database changes, applied in order.
- `supabase/functions/manage-platform-user/` — admin-only user create/update.
- `supabase/tests/phase1/` — free local PostgreSQL check of the Phase 1 migration (`run.sh`).
- `backups/phase1-2026-10-20/` — `backup.sql` (run right before the migration) and `rollback.sql`.

## Phase 1 deploy order

1. Run `backups/phase1-2026-10-20/backup.sql` on the database and check the row counts it prints.
2. Apply `supabase/migrations/20261020120000_phase1_roles_metrics_security.sql`.
3. Deploy the `manage-platform-user` Edge Function from `supabase/functions/`.
4. Merge this branch to `main` so GitHub Pages publishes `public/`.

Steps 2–4 belong together: after step 2 the old pages can no longer write project metrics,
and the new pages expect the columns step 2 adds. To undo, run `rollback.sql` and redeploy the previous `main`.

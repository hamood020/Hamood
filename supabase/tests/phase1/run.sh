#!/bin/sh
# Free local check of the Phase 1 migration on a plain PostgreSQL 16 (no Supabase branch needed).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres ./run.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
P="psql -v ON_ERROR_STOP=1 -q"
$P -c 'DROP DATABASE IF EXISTS icv_phase1_test'
$P -c 'CREATE DATABASE icv_phase1_test'
for f in 00_stubs 01_schema 02_policies 03_data; do $P -d icv_phase1_test -f "$HERE/$f.sql"; done
$P -d icv_phase1_test -f "$ROOT/backups/phase1-2026-10-20/backup.sql" >/dev/null
sed 's/^CREATE EXTENSION IF NOT EXISTS pg_cron;/-- pg_cron is stubbed locally/' \
  "$ROOT/supabase/migrations/20261020120000_phase1_roles_metrics_security.sql" | $P -d icv_phase1_test -1 >/dev/null
psql -q -d icv_phase1_test -f "$HERE/tests.sql"
$P -d icv_phase1_test -f "$ROOT/backups/phase1-2026-10-20/rollback.sql" >/dev/null && echo "rollback OK"

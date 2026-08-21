#!/usr/bin/env bash
# Day 10 — restore a custom-format pg_dump into DATABASE_URL
#
# WARNING: overwrites objects in the target DB. Prefer a staging DB for drills.
#
# Usage:
#   set -a && source .env && set +a
#   bash infra/scripts/12-restore-from-dump.sh /var/backups/ticketbox/ticketbox-YYYY-MM-DD.dump
#
# Or from S3:
#   aws s3 cp s3://YOUR_BACKUP_BUCKET/ticketbox/db/ticketbox-YYYY-MM-DD.dump /tmp/
#   bash infra/scripts/12-restore-from-dump.sh /tmp/ticketbox-YYYY-MM-DD.dump
set -euo pipefail

DUMP="${1:-}"
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: bash infra/scripts/12-restore-from-dump.sh /path/to/ticketbox-YYYY-MM-DD.dump"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Restoring ${DUMP} into DATABASE_URL (custom format)…"
pg_restore --clean --if-exists --no-owner --no-acl -d "$DATABASE_URL" "$DUMP"
echo "Restore finished. Smoke: psql \"\$DATABASE_URL\" -c 'select count(*) from events;'"

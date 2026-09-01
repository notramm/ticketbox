#!/usr/bin/env bash
# Day 10 — pg_dump TicketBox DB and optionally upload to S3
#
# Usage (on EC2):
#   set -a && source .env && set +a
#   export BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/   # optional
#   bash infra/scripts/11-pg-dump-backup.sh
#
# Requires: postgresql-client (pg_dump). For S3 upload: aws CLI configured
# or instance role with s3:PutObject on the backup prefix.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (export it or put it in Backend/.env)"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ticketbox}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
STAMP="$(date +%F)"
OUT="${BACKUP_DIR}/ticketbox-${STAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "Dumping to ${OUT}"
pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f "$OUT"
ls -lh "$OUT"

# Drop local dumps older than RETENTION_DAYS
find "$BACKUP_DIR" -name 'ticketbox-*.dump' -type f -mtime "+${RETENTION_DAYS}" -print -delete || true

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  DEST="${BACKUP_S3_URI%/}/ticketbox-${STAMP}.dump"
  echo "Uploading to ${DEST}"
  aws s3 cp "$OUT" "$DEST"
  echo "Uploaded OK"
else
  echo "BACKUP_S3_URI not set — local dump only"
fi

echo "Done."

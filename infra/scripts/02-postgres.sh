#!/usr/bin/env bash
# Day 6 — install PostgreSQL and create ticketbox DB + appuser
set -euo pipefail

DB_NAME="${DB_NAME:-ticketbox}"
DB_USER="${DB_USER:-appuser}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "Set DB_PASSWORD before running, e.g.:"
  echo "  export DB_PASSWORD='your-strong-password'"
  echo "  bash infra/scripts/02-postgres.sh"
  exit 1
fi

sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Create / update role
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
else
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
fi

# Create DB if missing
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
fi

# Node connects over TCP — ensure password auth for localhost
HBA="$(sudo -u postgres psql -tA -c 'SHOW hba_file;')"
MARKER="# ticketbox local appuser"
if ! sudo grep -Fq "${MARKER}" "${HBA}"; then
  echo "host    ${DB_NAME}    ${DB_USER}    127.0.0.1/32    scram-sha-256  ${MARKER}" | sudo tee -a "${HBA}" >/dev/null
  echo "host    ${DB_NAME}    ${DB_USER}    ::1/128         scram-sha-256  ${MARKER}" | sudo tee -a "${HBA}" >/dev/null
  sudo systemctl reload postgresql
fi

echo "Postgres ready."
sudo systemctl --no-pager is-active postgresql
echo "Test: PGPASSWORD=... psql -h 127.0.0.1 -U ${DB_USER} -d ${DB_NAME} -c 'select 1;'"

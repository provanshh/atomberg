#!/bin/bash
set -euo pipefail

POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_DB=${POSTGRES_DB:-goalsync}
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/var/lib/postgresql/data}
POSTGRES_BIN=${POSTGRES_BIN:-/usr/lib/postgresql/15/bin}

if [ ! -s "${POSTGRES_DATA_DIR}/PG_VERSION" ]; then
  su - postgres -c "${POSTGRES_BIN}/initdb -D '${POSTGRES_DATA_DIR}'"
fi

su - postgres -c "${POSTGRES_BIN}/pg_ctl -D '${POSTGRES_DATA_DIR}' -o \"-c listen_addresses='127.0.0.1'\" -w start"

POSTGRES_ROLE_SQL="DO $$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN\n    CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}';\n  END IF;\nEND\n$$;"
POSTGRES_DB_SQL="DO $$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}') THEN\n    CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};\n  END IF;\nEND\n$$;"

su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"${POSTGRES_ROLE_SQL}\""
su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"${POSTGRES_DB_SQL}\""

export DATABASE_URL="${DATABASE_URL:-postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?sslmode=disable}"

/app/goalsync &
BACKEND_PID=$!

cd /app/frontend
npm run preview -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

trap "su - postgres -c \"${POSTGRES_BIN}/pg_ctl -D '${POSTGRES_DATA_DIR}' -m fast stop\"; kill \"${BACKEND_PID}\" \"${FRONTEND_PID}\"" INT TERM
wait -n "${BACKEND_PID}" "${FRONTEND_PID}"

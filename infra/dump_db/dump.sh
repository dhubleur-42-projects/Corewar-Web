#!/bin/bash

set -euo pipefail

: "${POSTGRES_HOST:?Need to set POSTGRES_HOST}"
: "${POSTGRES_USER:?Need to set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Need to set POSTGRES_PASSWORD}"
: "${POSTGRES_DB:?Need to set POSTGRES_DB}"
: "${POSTGRES_PORT:?Need to set POSTGRES_PORT}"
: "${AWS_ACCESS_KEY_ID:?Need to set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Need to set AWS_SECRET_ACCESS_KEY}"
: "${AWS_DEFAULT_REGION:?Need to set AWS_DEFAULT_REGION}"
: "${S3_BUCKET_NAME:?Need to set S3_BUCKET_NAME}"

RAW_DUMP_FILE="/tmp/raw_dump.sql"
FINAL_DUMP_FILE="/tmp/anonymized_dump.sql"

export PGPASSWORD="${POSTGRES_PASSWORD}"

_create_raw_dump() {
	pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -p "${POSTGRES_PORT}" -d "${POSTGRES_DB}" -F p -f "${RAW_DUMP_FILE}"
	echo "Raw dump created at ${RAW_DUMP_FILE}"
}

_start_local_pg() {
  mkdir -p /var/lib/postgresql/data

  if [ ! -d "/var/lib/postgresql/data/base" ]; then
    gosu postgres initdb -D /var/lib/postgresql/data
  fi

  gosu postgres pg_ctl -D /var/lib/postgresql/data -o "-p 5432" -w start

  psql -h localhost -U postgres -c "CREATE ROLE ${POSTGRES_USER} WITH LOGIN SUPERUSER;"

  echo "Local PostgreSQL server started"
}

_restore_local_db() {
	psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
	psql -h localhost -U postgres -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"
	psql -h localhost -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f "${RAW_DUMP_FILE}"
	echo "Temporary database ${POSTGRES_DB} restored"
}

_create_anonymized_dump() {
	psql -h localhost -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f "/app/anonymize.sql"
	echo "Anonymization script executed"

	pg_dump -h localhost -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F p -f "${FINAL_DUMP_FILE}"
	echo "Final anonymized dump created at ${FINAL_DUMP_FILE}"
}

_stop_local_pg() {
  gosu postgres pg_ctl -D /var/lib/postgresql/data -w stop
  echo "Local PostgreSQL server stopped"
}

_upload_dump_to_s3() {
	aws s3 cp "${FINAL_DUMP_FILE}" "s3://${S3_BUCKET_NAME}/anonymized_dump_$(date +%Y%m%d_%H%M%S).sql"
	echo "Anonymized dump uploaded to S3"
}

_create_raw_dump
_start_local_pg
_restore_local_db
_create_anonymized_dump
_stop_local_pg
_upload_dump_to_s3
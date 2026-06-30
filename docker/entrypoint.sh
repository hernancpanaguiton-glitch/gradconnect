#!/usr/bin/env bash
set -e

# ── Wait for Postgres to accept connections ───────────────────────────
echo "Waiting for database at ${DB_HOST:-db}:${DB_PORT:-5432}..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-gradconnect}" >/dev/null 2>&1; do
    sleep 1
done
echo "Database is ready."

# ── Ensure an application key exists ──────────────────────────────────
if [ -z "${APP_KEY}" ]; then
    echo "APP_KEY not set; generating one..."
    php artisan key:generate --force
fi

# The web container owns first-time setup (migrate/seed). The queue
# worker container skips it to avoid two processes racing on migration.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force

    # Seed once: marker file lives on the shared storage volume.
    if [ ! -f storage/.seeded ]; then
        echo "Seeding demo data (first run)..."
        php artisan db:seed --force
        touch storage/.seeded
    fi

    php artisan storage:link || true
fi

exec "$@"

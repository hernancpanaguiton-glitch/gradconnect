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
    # In production every container must share one fixed key, or sessions
    # and encrypted data break between them. Stop instead of guessing.
    if [ "${APP_ENV:-local}" = "production" ]; then
        echo "APP_KEY is empty. Set it in .env before starting (see DEPLOY-HOSTINGER.md)." >&2
        exit 1
    fi
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
        if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
            echo "Seeding demo data (first run)..."
            php artisan db:seed --force
        else
            # Production: roles, colleges and skills only — never the demo
            # accounts, whose password is public. Create the first admin
            # with `php artisan app:create-admin`.
            echo "Seeding reference data (first run)..."
            php artisan db:seed --class=RolePermissionSeeder --force
            php artisan db:seed --class=CollegeSeeder --force
            php artisan db:seed --class=SkillCatalogSeeder --force
        fi
        touch storage/.seeded
    fi

    php artisan storage:link || true
fi

# Production: cache config, routes and views once per container start.
if [ "${APP_ENV:-local}" = "production" ]; then
    php artisan optimize
fi

exec "$@"

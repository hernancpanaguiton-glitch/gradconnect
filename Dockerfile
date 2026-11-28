# syntax=docker/dockerfile:1

# ── Stage 1: build front-end assets (Vite + React) ────────────────────
FROM node:22-bookworm-slim AS assets

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite needs the source + config to compile the manifest.
COPY vite.config.js tsconfig.json postcss.config.js tailwind.config.js ./
COPY resources ./resources
RUN npm run build


# ── Stage 2: PHP application ──────────────────────────────────────────
FROM php:8.3-cli-bookworm AS app

# System libs + PHP extensions GradConnect needs:
#   pdo_pgsql  -> Postgres / pgvector
#   zip, gd    -> common Laravel + asset handling
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        curl \
        ca-certificates \
    # pg_dump must match the PostgreSQL 16 server (Debian's own client is 15,
    # which refuses to back it up), so take the client from PostgreSQL's repo.
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-16 \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql zip gd bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer (copied from the official image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
# NOTE: dev dependencies are kept because the demo seeder uses model
# factories, which rely on fakerphp/faker (a require-dev package).
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --prefer-dist --no-progress

# Copy the rest of the application source.
COPY . .

# Bring in the compiled front-end assets from stage 1.
COPY --from=assets /app/public/build ./public/build

# Finish composer setup now that the full app (including artisan) is present.
RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]


# ── Stage 3: production server (docker-compose.prod.yml) ──────────────
# FrankenPHP is a production PHP server built on Caddy: it serves many
# requests at once (artisan serve does not) and gets HTTPS certificates
# from Let's Encrypt automatically for the domain in SERVER_NAME.
FROM dunglas/frankenphp:1.13.4-php8.3-bookworm AS production

RUN install-php-extensions pdo_pgsql pgsql zip gd bcmath pcntl opcache \
    && apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-16 \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/production/php.ini "$PHP_INI_DIR/conf.d/zz-gradconnect.ini"
COPY docker/production/Caddyfile /etc/caddy/Caddyfile
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Runtime packages only: no test tools or fake-data generators in production.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-progress

COPY . .
COPY --from=assets /app/public/build ./public/build

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]

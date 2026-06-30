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
        postgresql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql zip gd bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer (copied from the official image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-progress

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

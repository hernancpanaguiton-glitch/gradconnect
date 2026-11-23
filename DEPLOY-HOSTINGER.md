# GradConnect — Deploying to a Hostinger VPS

This puts GradConnect on the internet at your own domain, with HTTPS, on a Hostinger **VPS** (a virtual server you control). It uses the same Docker setup as local testing, with production settings: a real web server, no demo accounts, real email, and a database that is not reachable from outside.

**Time needed:** about an hour, most of it waiting for DNS and the first build.

> ⚠️ Hostinger's *shared* web hosting plans (such as "Premium", "Business" or the website-builder plans) **cannot** run GradConnect: they have no PostgreSQL, no Docker and no background worker. You need a **VPS** plan.

---

## 1. What you need

- **A Hostinger VPS** (KVM plans) with **at least 4 GB of RAM**. The first build compiles the front end and needs the memory.
- **A domain name** (for example `gradconnect-uclm.com`), from Hostinger or any registrar. You can start without one and add it later; without it the site runs on plain HTTP only.
- **An email account to send from**, such as `no-reply@your-domain`. New graduates must confirm their email address to sign in, so this must work. A Hostinger email plan for your domain is the simplest.
- **AI keys** (optional): `GEMINI_API_KEY` and `GROQ_API_KEY`, the same as in local testing.

On your own computer you need a terminal: PowerShell on Windows, or Terminal on macOS.

---

## 2. Create the VPS

1. In **hPanel → VPS**, set up the server and choose the operating system **Ubuntu 24.04**. If an *Ubuntu 24.04 with Docker* template is offered, pick that; it saves step 4.
2. Set a strong **root password**, or better, add your **SSH key**.
3. When it is ready, note the server's **IP address** from the VPS overview, for example `203.0.113.25`.

---

## 3. Connect to the server

From your computer:

```bash
ssh root@203.0.113.25
```

Use your server's IP. Answer `yes` to the fingerprint question the first time. Every command from here on runs **on the server**.

---

## 4. Install Docker (skip if you chose the Docker template)

```bash
curl -fsSL https://get.docker.com | sh
docker compose version
```

The second command should print a version number.

---

## 5. Open the firewall

Only SSH and the website should be reachable:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw enable
```

If hPanel also has a firewall for this VPS, allow the same ports (22, 80 and 443) there.

---

## 6. Get the code

```bash
git clone https://github.com/hernancpanaguiton-glitch/gradconnect.git /opt/gradconnect
cd /opt/gradconnect
```

If the repository is private, GitHub asks for a username and password. Use your GitHub username, and a **personal access token** with read access to this repository as the password (GitHub → Settings → Developer settings → Personal access tokens).

---

## 7. Fill in the settings

```bash
cp .env.production.example .env
openssl rand -base64 32
openssl rand -hex 24
nano .env
```

The two `openssl` lines each print a random value. In the editor:

| Setting | What to put |
|---------|-------------|
| `APP_KEY` | `base64:` followed by the first random value, e.g. `base64:Xk3…=`. Set it once and never change it. |
| `DB_PASSWORD` | The second random value. |
| `SERVER_NAME` | Your domain, e.g. `gradconnect-uclm.com`. |
| `APP_URL` | `https://` + your domain. |
| `MAIL_USERNAME`, `MAIL_FROM_ADDRESS` | The sending address, e.g. `no-reply@gradconnect-uclm.com`. |
| `MAIL_PASSWORD` | That email account's password. |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | Your AI keys, or leave empty. |

Save with `Ctrl` + `O`, `Enter`, then exit with `Ctrl` + `X`.

**Self-hosted embeddings (recommended).** Run the résumé/job embeddings on this server with Ollama, so résumé text is not sent to Google. Add `ollama` to `COMPOSE_PROFILES` (for example `COMPOSE_PROFILES=ollama`, or `uat-mail,ollama`) and set `AI_EMBEDDING_PROVIDER=ollama`. The first start downloads the `nomic-embed-text` model once, about 300 MB. Scoring still uses Groq, so keep `GROQ_API_KEY`. If you switch embedding provider after résumés and jobs already exist, they must be embedded again: vectors from different models cannot be compared.

**A UAT or test server?** Catch emails instead of sending them. Use option **A** in the Email part of `.env`: every email lands in a password-protected web inbox at `https://inbox.your-domain`, and nobody outside the test receives anything. Add an `A` record for `inbox` as well in step 8. Switch to option **B** when you go live.

**No domain yet?** Set `SERVER_NAME=:80`, `APP_URL=http://203.0.113.25` (your IP) and `SESSION_SECURE_COOKIE=false`. Switch to the domain values later and restart (step 12).

> 🔒 `.env` holds the server's secrets. Never copy it into Git, chat or email.

---

## 8. Point the domain at the server

At your domain's DNS settings (hPanel → Domains → DNS, if Hostinger manages it), create:

| Type | Name | Points to |
|------|------|-----------|
| `A` | `@` | your VPS IP |
| `A` | `www` | your VPS IP |
| `A` | `inbox` | your VPS IP (only for the UAT inbox) |

New Hostinger domains often come with `A` records that already point at Hostinger's parking page. Edit or delete those, so each name points only at your VPS.

To answer on `www` as well, set `SERVER_NAME=your-domain, www.your-domain`.

Wait until it resolves to your IP. This usually takes minutes, but can take a few hours:

```bash
getent hosts gradconnect-uclm.com
```

Start the app (step 9) only after this prints your VPS IP. The HTTPS certificate is requested the moment the app starts, and it needs the domain to reach the server.

---

## 9. Start GradConnect

```bash
cd /opt/gradconnect
docker compose up -d --build
docker compose logs -f app
```

The first build takes 5–15 minutes. You are done when the log shows the migrations, `Seeding reference data (first run)...`, and then the server starting. Press `Ctrl` + `C` to stop watching the log; the app keeps running.

`docker compose` uses the production setup automatically here, because `.env` says `COMPOSE_FILE=docker-compose.prod.yml`.

---

## 10. Create your administrator account

There are **no demo accounts** in production. Create the first administrator; it asks for the name, email and a password of at least 12 characters, which is not shown as you type:

```bash
docker compose exec app php artisan app:create-admin
```

---

## 11. Check it works

1. Open `https://your-domain`. The home page loads, with a padlock in the address bar.
2. Sign in with the administrator account from step 10.
3. In a private window, register as a **Graduate Student** with a real email address you can read. The confirmation email arrives, and its link works.
4. As the administrator, open **Colleges & Programs**. All ten UCLM colleges are there.
5. If you set AI keys: as the graduate, upload a résumé. Within a minute or two, **Recommendations** show matches, as long as there are open job postings.

---

## 12. Everyday tasks

Run these in `/opt/gradconnect`.

| Goal | Command |
|------|---------|
| Update to the latest code | `git pull` then `docker compose up -d --build` |
| Apply changed settings (`.env`) | `docker compose up -d` |
| See what's running | `docker compose ps` |
| Follow the app log | `docker compose logs -f app` |
| Laravel's own error log | `docker compose exec app tail -n 50 storage/logs/laravel.log` |
| Restart everything | `docker compose restart` |

> ⚠️ **Never run these on the live server:** `php artisan test`, `migrate:fresh`, `db:seed`, or `docker compose down -v`. Each one erases or replaces real data. Never set `APP_DEBUG=true` either: error pages would show your settings to visitors.

---

## 13. Back up the database every night

Make a folder for the backups, then open the server's scheduled-task list:

```bash
mkdir -p /root/backups
crontab -e
```

Add this as **one line** at the bottom (choose `nano` if asked), then save and exit:

```bash
0 2 * * * cd /opt/gradconnect && docker compose exec -T db pg_dump -U gradconnect gradconnect | gzip > /root/backups/gradconnect-$(date +\%F).sql.gz && find /root/backups -name '*.sql.gz' -mtime +14 -delete
```

Every night at 2:00 this saves a compressed copy of the database and keeps the last 14 days. Test it once by hand, leaving out `0 2 * * *` and the `\` before `%F`. Then copy a backup to your own computer now and then: run `scp root@203.0.113.25:/root/backups/*.sql.gz .` **on your computer**. A backup that exists only on the same server does not survive losing that server. Hostinger's VPS snapshots in hPanel are a good second layer.

**Restoring a backup.** This replaces the current database. Stop the app first:

```bash
docker compose stop app queue
gunzip -c /root/backups/gradconnect-2026-11-24.sql.gz | docker compose exec -T db psql -U gradconnect -d gradconnect
docker compose start app queue
```

Restore into a database that is empty or freshly created. Restoring on top of existing data reports "already exists" errors.

---

## 14. Troubleshooting

**The browser warns the site is not secure, or HTTPS never works**
The certificate is only issued once the domain points at the server and ports 80 and 443 are open. Check step 8 (`getent hosts`) and step 5. Then `docker compose restart app`, and look for certificate errors in `docker compose logs app`.

**You sign in, but are immediately signed out again**
The site is on plain HTTP while `SESSION_SECURE_COOKIE=true`. Either finish HTTPS, or set it to `false` and run `docker compose up -d`.

**"APP_KEY is empty" and the app keeps restarting**
Fill in `APP_KEY` (step 7) and run `docker compose up -d`.

**Confirmation emails never arrive**
Check the `MAIL_` values against hPanel → Emails → your account → configuration, and look in the spam folder. Errors appear in Laravel's log (step 12).

**The build stops with "killed" or runs out of memory**
Add swap space, then build again:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
docker compose up -d --build
```

**A page shows "Server Error"**
Read the last lines of Laravel's log (step 12). The real error is there; production deliberately hides it from visitors.

---

## How it differs from local testing

| | Local (`docker-compose.yml`) | Production (`docker-compose.prod.yml`) |
|---|---|---|
| Web server | `php artisan serve` on :8000 | FrankenPHP on :80/:443 with automatic HTTPS |
| Data on first start | Demo accounts and sample data | Roles, colleges and skills only; you create the admin |
| Email | Caught by Mailpit | Really sent through your mail provider |
| Database | Reachable on `127.0.0.1:5432` | Reachable only by the app |
| PHP packages | Including test tools | Runtime packages only |
| Errors | Shown in detail | Logged; visitors see a plain error page |

# GradConnect — Docker Setup Guide

A complete, start-to-finish guide to running **GradConnect** on your own computer using Docker. No PHP, Node.js, or PostgreSQL installation required — Docker bundles everything.

**Time needed:** ~10–15 minutes (most of it is the one-time image build).

---

## Table of contents

1. [What you'll end up with](#1-what-youll-end-up-with)
2. [Prerequisites](#2-prerequisites)
3. [Install Docker Desktop](#3-install-docker-desktop)
4. [Get the project](#4-get-the-project)
5. [Configure your environment file](#5-configure-your-environment-file)
6. [Build and start the app](#6-build-and-start-the-app)
7. [Open and log in](#7-open-and-log-in)
8. [(Optional) Enable AI matching](#8-optional-enable-ai-matching)
9. [Everyday commands](#9-everyday-commands)
10. [Stopping and resetting](#10-stopping-and-resetting)
11. [Troubleshooting](#11-troubleshooting)
12. [How it works under the hood](#12-how-it-works-under-the-hood)

---

## 1. What you'll end up with

When you finish, three containers will be running together:

| Container | What it does |
|-----------|--------------|
| **app** | The GradConnect web application, served at `http://localhost:8000` |
| **db** | PostgreSQL with the `pgvector` extension (stores data + AI embeddings) |
| **queue** | A background worker that processes résumé/job matching jobs |

The database is migrated and seeded with demo data automatically on first launch.

---

## 2. Prerequisites

You only need two things:

- **Docker Desktop** (installed in the next step)
- The **GradConnect project files** (from Git or a zip/folder your instructor shared)

> 💡 You do **not** need to install PHP, Composer, Node.js, npm, or PostgreSQL. They all run inside Docker.

---

## 3. Install Docker Desktop

### Windows

1. Download Docker Desktop from <https://www.docker.com/products/docker-desktop/>.
2. Run the installer. When prompted, **keep the "Use WSL 2" option enabled** (recommended).
3. Restart your computer if asked.
4. Launch **Docker Desktop** and wait until the whale icon in the system tray is steady (not animating). This means the engine is running.

> If Docker asks you to install or update **WSL 2**, follow its prompt, or open PowerShell as Administrator and run `wsl --install`, then restart.

### macOS

1. Download Docker Desktop (choose **Apple Silicon** for M1/M2/M3 Macs, or **Intel** for older ones).
2. Open the `.dmg` and drag **Docker** into **Applications**.
3. Launch Docker from Applications and wait for the whale icon in the menu bar to go steady.

### Linux

Install **Docker Engine** + the **Compose plugin** following the official docs for your distribution: <https://docs.docker.com/engine/install/>.

### Verify the installation

Open a terminal (PowerShell on Windows, Terminal on macOS/Linux) and run:

```bash
docker --version
docker compose version
```

Both commands should print a version number. If they do, Docker is ready.

---

## 4. Get the project

**If you have Git:**

```bash
git clone <REPOSITORY_URL> gradconnect
cd gradconnect
```

**If you received a zip / folder:**

Extract it, then open a terminal **inside** the project folder (the one containing `docker-compose.yml`). On Windows you can open the folder in File Explorer, type `powershell` in the address bar, and press Enter.

To confirm you're in the right place, run `ls` (or `dir` on Windows) — you should see `docker-compose.yml`, `Dockerfile`, and `composer.json`.

---

## 5. Configure your environment file

The project ships with a template called `.env.docker.example`. Copy it to `.env.docker`:

**Windows (PowerShell):**

```powershell
Copy-Item .env.docker.example .env.docker
```

**macOS / Linux:**

```bash
cp .env.docker.example .env.docker
```

That's it — the defaults already point at the bundled database and include an app key. You can open `.env.docker` in a text editor later if you want to add AI keys (see [step 8](#8-optional-enable-ai-matching)).

> ⚠️ Don't rename it to plain `.env` — Docker Compose specifically loads `.env.docker`.

---

## 6. Build and start the app

From inside the project folder, run:

```bash
docker compose up --build
```

The **first** run takes several minutes because Docker:

1. Downloads the PHP, Node, and PostgreSQL base images
2. Installs PHP (Composer) and JavaScript (npm) dependencies
3. Compiles the front-end assets
4. Starts PostgreSQL, waits for it, then runs migrations and seeds demo data

You'll know it's ready when you see log lines like:

```
app    | Database is ready.
app    | Running migrations...
app    | Seeding demo data (first run)...
app    | INFO  Server running on [http://0.0.0.0:8000].
```

Leave this terminal window open — it shows the live logs. (To run it in the background instead, see [step 9](#9-everyday-commands).)

---

## 7. Open and log in

Open your browser to:

### 👉 http://localhost:8000

Log in with one of the seeded demo accounts:

| Role | Email |
|------|-------|
| Alumni | `alumni@gradconnect.edu.ph` |
| Student | `student@gradconnect.edu.ph` |
| Partner / Employer | `partner@gradconnect.edu.ph` |

> The password for these accounts is set by the seeder. Check the **GradConnect Tester Guide** (the included PDF/HTML) or ask your instructor for the shared password.

---

## 8. (Optional) Enable AI matching

GradConnect runs perfectly fine without AI keys — the résumé ↔ job **AI recommendations** simply stay empty. To turn them on:

1. Open `.env.docker` in a text editor.
2. Paste the shared keys into these lines:

   ```env
   GEMINI_API_KEY=your-gemini-key-here
   GROQ_API_KEY=your-groq-key-here
   ```

3. Save the file and restart the stack so it picks up the change:

   ```bash
   docker compose down
   docker compose up
   ```

Both providers offer free tiers. Your instructor may share a key, or you can create your own:
- **Gemini** (embeddings): <https://aistudio.google.com/app/apikey>
- **Groq** (scoring): <https://console.groq.com/keys>

---

## 9. Everyday commands

Run all of these from inside the project folder.

| Goal | Command |
|------|---------|
| Start (foreground, shows logs) | `docker compose up` |
| Start in the background | `docker compose up -d` |
| Rebuild after code changes | `docker compose up --build` |
| View live app logs | `docker compose logs -f app` |
| View database logs | `docker compose logs -f db` |
| List running containers | `docker compose ps` |
| Open a shell inside the app | `docker compose exec app bash` |
| Run an Artisan command | `docker compose exec app php artisan <command>` |
| Stop everything | `docker compose down` |

Example — re-seed the database manually:

```bash
docker compose exec app php artisan migrate:fresh --seed --force
```

---

## 10. Stopping and resetting

**Stop the app (keeps your data):**

```bash
docker compose down
```

Your database and uploaded files are preserved in Docker volumes, so next time you `docker compose up` everything is exactly as you left it.

**Full reset (wipe the database and start completely fresh):**

```bash
docker compose down -v
```

The `-v` flag deletes the data volumes. The next `docker compose up --build` will re-migrate and re-seed from scratch — useful if you want clean demo data again.

---

## 11. Troubleshooting

**"Cannot connect to the Docker daemon" / commands hang**
Docker Desktop isn't running. Launch it and wait for the whale icon to stop animating, then retry.

**Port 8000 is already in use**
Another program is using port 8000. Either stop it, or change the host port in `docker-compose.yml`:
```yaml
    ports:
      - "8080:8000"   # now open http://localhost:8080 instead
```
Then run `docker compose up` again.

**The page won't load right after starting**
Watch the logs — the app only serves once you see `Server running on [http://0.0.0.0:8000]`. Migrations and seeding run first and can take a moment.

**Login fails / no demo data**
The seed may not have run (e.g. if you interrupted the first boot). Force a fresh seed:
```bash
docker compose exec app php artisan migrate:fresh --seed --force
```

**"port 5432 already in use" (you have a local Postgres)**
The database is internal and not published to your host by default, so this is rare. If it happens, make sure no other Postgres container is mapping 5432.

**AI recommendations are empty**
That's expected without keys — see [step 8](#8-optional-enable-ai-matching). After adding keys, restart with `docker compose down && docker compose up`.

**Build fails on `npm run build`**
Usually a transient network hiccup downloading packages. Re-run `docker compose up --build`. If it persists, check your internet connection / proxy.

**Start over from absolute scratch**
```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## 12. How it works under the hood

For the curious — the setup is defined by three files:

- **`Dockerfile`** — a two-stage build. Stage 1 (Node) compiles the React/Vite front-end assets. Stage 2 (PHP 8.3) installs Composer dependencies, copies in the compiled assets, and prepares the app to serve.
- **`docker-compose.yml`** — defines the three services (`app`, `queue`, `db`), wires them together on a private network, and creates named volumes for the database (`db-data`) and Laravel storage (`storage-data`) so your data persists.
- **`docker/entrypoint.sh`** — runs every time the `app` container starts. It waits for PostgreSQL to be ready, ensures an `APP_KEY` exists, runs database migrations, and seeds demo data the first time only.

The database uses the **`pgvector/pgvector:pg16`** image because GradConnect stores AI embeddings as vector columns and queries them with nearest-neighbour (HNSW) indexes — features a standard PostgreSQL image doesn't include.

---

Happy testing! 🎓

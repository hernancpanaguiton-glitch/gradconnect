## Implementation/Deployment Phase

### Installation Guide

GradConnect is installed with Docker, which packages the web application, background worker, database and mail inbox so that the system runs the same way on any computer.

**Requirements**

- A computer running Windows 10 or later, macOS or Linux, with at least 8 GB of memory.
- Docker Desktop (or Docker Engine with Docker Compose), installed and running.
- A copy of the GradConnect project folder.
- Ports 8000, 8025 and 5432 free on the computer.

**Step 1: Prepare the settings file.** Open a terminal inside the project folder and create the settings file from the example provided:

```
cp .env.docker.example .env.docker
```

To enable the AI résumé matching, paste the Groq and Gemini API keys into `.env.docker`. The system runs without them; the AI recommendations simply stay empty.

**Step 2: Start the system.** Run:

```
docker compose up -d --build
```

The first start takes several minutes while the system is built. On its first run it prepares the database by itself and fills it with demonstration data, so no separate setup is needed.

**Step 3: Confirm it is running.** Run:

```
docker compose ps
```

The four services, `app`, `queue`, `db` and `mail`, should all show as running.

**Step 4: Open the system.** In a web browser, go to `http://localhost:8000` for GradConnect and `http://localhost:8025` for the mail inbox, where every email the system sends can be read.

**Demonstration accounts.** Every demonstration account uses the password `password`:

- Administrator: `admin@gradconnect.edu.ph`
- Graduate Student: `student@gradconnect.edu.ph`
- Alumni: `alumni@gradconnect.edu.ph`
- Industry Partner: `partner@gradconnect.edu.ph`
- Alumni Affairs Office: `alumni.affairs@gradconnect.edu.ph`
- Department Head: `depthead.ccs@gradconnect.edu.ph`
- Student Affairs Office: `sao@gradconnect.edu.ph`

**Stopping and restarting.** To stop the system, run the command below. All data is kept and returns the next time the system starts with `docker compose up -d`.

```
docker compose down
```

**Updating to a newer version.** After replacing the project folder with a newer version, rebuild and restart with `docker compose up -d --build`. Any database changes in the new version are applied automatically on start; they can also be applied by hand with:

```
docker compose exec app php artisan migrate
```

**Resetting the demonstration data.** To erase all records and restore the original demonstration data, run the command below. This deletes every account and record created since installation, so it should only be used on a test copy.

```
docker compose exec app php artisan migrate:fresh --seed
```

**Troubleshooting.** If a page shows an error, the details can be viewed with:

```
docker compose logs -f app
```

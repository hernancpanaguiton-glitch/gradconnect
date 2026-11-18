## Technology Stack

The Technology Stack of GradConnect shows the technologies used to build each layer of the system. Users reach the system through a web browser on any device. The pages are written in React 18.3 with TypeScript 5.9, styled with Tailwind CSS 3.4, and built with Vite 7.3. Inertia.js connects these pages to the Laravel 13.18 back end, which runs on PHP and handles routing, sign-in, role-based access through Spatie Laravel Permission 8.1, and every system function. Data is kept in a PostgreSQL 16 database with the pgvector extension, which stores the AI representations of résumés and job postings and finds the most similar ones. Groq and Gemini provide the AI matching and text analysis, and the whole system runs in Docker containers so that it installs the same way on any computer.

The updated diagram is Figure 48 in the Figures part of this document.

## Software Development Specification

The following software was used to develop GradConnect. Version numbers are those of the installed packages.

**Front-end:**

- React 18.3
- TypeScript 5.9
- Tailwind CSS 3.4
- Vite 7.3
- Recharts 3.9 (charts)

**Bridge:**

- Inertia.js 2.0 (server adapter) and 2.3 (React client)

**Back-end:**

- PHP 8.3 or later (8.3 in the Docker image)
- Laravel 13.18
- Spatie Laravel Permission 8.1
- Laravel Sanctum 4.3
- Smalot PDF Parser 2.0

**Database:**

- PostgreSQL 16
- pgvector

**AI Services:**

- Groq (match scoring, primary)
- Gemini (match scoring, fallback)
- Gemini Embeddings (768 dimensions)

**Environment:**

- Docker Compose (web application, background worker, database, mail inbox)

**Testing:**

- PHPUnit 12.5
- Vitest 3.2 with React Testing Library 16.3
- GitHub Actions (continuous integration)

**Development tools:**

- Visual Studio Code
- GitHub
- Figma

**Operating System:**

- Windows 10 and above

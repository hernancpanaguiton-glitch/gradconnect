## Testing Plan

The researchers tested GradConnect at the four levels set out in the Capstone Project Manual: unit, integration, alpha and acceptance testing. Unit and integration testing were automated, so that every feature could be checked again after each change instead of only once. Alpha and acceptance testing involve people, because they judge whether the system is usable and acceptable rather than whether a function returns the right result.

**Unit testing** checked each module on its own. The server side was tested with PHPUnit, through Laravel's testing tools, and the pages were tested with Vitest and React Testing Library. Each test prepares a known situation, performs one action, such as signing in with a wrong password, and checks the result. The tests run against a separate temporary database, so testing never altered real records.

**Integration testing** checked that modules work together, such as a new job posting being matched against graduates' résumés and the results reaching the employer's candidate list. These flows were covered by automated tests that pass work from one module to the next.

**Alpha testing** was carried out by «TO FILL: number of testers» testers using the deployed system, with the step-by-step test guide prepared for GradConnect, which has 134 checks covering every user role, mobile screens and both colour themes. Testers rated the system on the criteria in the manual's Alpha Testing form.

**Acceptance testing** was conducted with «TO FILL: name or office of the project sponsor» to confirm that the system meets the acceptance criteria derived from the objectives of the study.

The automated tests are also run by GitHub Actions on every push to the main branch and on every pull request, so a change that breaks an existing feature is caught before it is accepted.

The results of the automated tests come from a single recorded run, summarised below. Five server-side tests were skipped in that run: they exercise vector similarity search, which needs PostgreSQL with the pgvector extension and cannot run on the temporary SQLite test database.

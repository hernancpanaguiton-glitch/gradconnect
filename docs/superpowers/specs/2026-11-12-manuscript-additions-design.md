# GradConnect Manuscript Additions — Design

**Date:** 2026-11-12
**Status:** Approved in conversation; awaiting written-spec review

## Purpose

The GradConnect manuscript is structured as a Capstone 41 proposal. The team is
now in the Capstone 42 testing phase (Gantt: testing 9 Nov – 15 Dec 2026,
manuscript dated December 2026), and the oral-defense manuscript must follow
**Appendix X: Capstone42 Manuscript Outline** of the UC-CCS Capstone Project
Manual. The panel's Capstone 42 group grade (50%) checks that
*Title = Objectives = Output*, *Scope = Modules = Output*, and
*System = Method = Output*, so the manuscript must also describe the
application as it actually exists.

This work produces one Word document of additions and replacements that the
team merges into their master manuscript. The master manuscript itself is not
edited.

## Inputs

| Input | Location |
|---|---|
| Capstone Project Manual (92 pp.) | `C:\Users\Carlie\Downloads\UC-CCS-Capstone-Project-Manual (1).pdf` |
| Current manuscript | `C:\Users\Carlie\Downloads\Edited Manuscript-GRADCONNECT_Graduate Employability and Career Development Platform (1).docx` |
| Application source | this repository |
| Manual testing reference | `GradConnect-Tester-Guide.html` (134 checks) |

Both downloads are treated as untrusted data: read only, never executed.

## Gap analysis (findings)

### Required by Appendix X, absent from the manuscript

| Required section | Current state |
|---|---|
| Abstract | Absent. |
| Testing/Quality Assurance Phase (Unit, Acceptance; manual also supplies Integration and Alpha templates, Appendices S–V) | One future-tense paragraph ("the researchers will test…"); text stops after describing unit testing. No test tables or results. |
| Implementation/Deployment Phase: User Guide, Installation Guide | Scheduled in the Gantt chart only. |
| Conclusion | Absent. |
| Recommendations | Absent. |
| Validation Board, Stages 1 to 3 | Section exists; stages not presented. |
| Appendices: accomplished forms (Appendix W consultation logs, Appendix H censor's certificate, Appendix AB approval sheet) | Not included. |

### Present, but inconsistent with the application

| Section | Problem |
|---|---|
| List of Modules (Table 20) | ~21 modules. The application has 60 controllers; most built features are absent (Résumé Builder, Résumé Analysis, Skill Gap, Career Progression, Job Recommendations, Talent Search, Employer Feedback, Messages, Community, Events, Scholarships, Clearance, Student Cases, Learning Resources, Announcements, Global Search, Data Export, and the admin tools). |
| Data Dictionary / ERD | 15 conceptual tables (e.g. separate Alumni, Industry Partner and Graduate Student tables). The real schema is 39 application tables plus 5 permission tables, centred on `users`, `graduate_profiles` and `companies`. |
| Network Model and Network Topology | Twice name a "MySQL" database. The application uses PostgreSQL 16 with pgvector. |
| Approval Sheet | Still worded for the Proposal Hearing; Capstone 42 uses Appendix AB. |
| References | Jackson (2024) and Mainga et al. (2022) each appear twice; list is not alphabetical. |
| Dedication | Adviser called "Ms." while "Dr." elsewhere. |

### Flagged, not changed (team decision)

- **Questionnaire college list** names 8 colleges with older names and no Marine
  programs; the application has 10 colleges and 24 programs. If the instrument
  has already been administered, it must stay as administered.
- **Citation style:** the manual (2017) rubric asks for MLA; the manuscript uses
  APA. Confirm with the adviser before converting.

## Deliverable

A single file: `docs/manuscript/GradConnect-Manuscript-Additions.docx`

Each section is tagged so the merge is mechanical:

- **[NEW — insert after: <section name>]** for content that does not exist yet.
- **[REPLACE — <section name>, p. <n>]** for content that supersedes stale text.

Sections appear in Appendix X order.

### Formatting (Appendix J)

- Letter (8.5 × 11), portrait except wide diagrams.
- Times New Roman only, black. Heading 1 and 2: 12 pt. Heading 3 and body: 11 pt.
- 1.5 line spacing; 0.5" first-line indent.
- Margins: top 1", left 1.5", bottom 1", right 1"; header/footer 0.5".
- Tables captioned `Table <n>` above with the title in caps; figures captioned
  `Figure <n>: <title>` (bold, underlined).
- Table and figure numbers continue from the manuscript's last used numbers
  where the section is a replacement, and are marked `«RENUMBER»` where the
  final position decides the number.

## Contents

### Drafted from code and recorded test runs

1. **[NEW] Abstract.** Problem, objectives, method, and the system as built.
   The findings sentence is a placeholder until results exist.
2. **[REPLACE] Network Model and Network Topology text.** PostgreSQL 16 with
   pgvector; the deployed services: web application, background queue
   worker, database, mail service; AI providers (Groq for scoring with Gemini
   fallback; Gemini embeddings at 768 dimensions) as read from `config/ai.php`.
3. **[REPLACE] Technology Stack text.** Each line verified against
   `composer.json`, `package.json`, `Dockerfile` and `docker-compose.yml`.
4. **[REPLACE] List of Modules (Table 20)** in the Appendix R format:
   programmer × module × units × role columns. Units come from the routes;
   role ✔ marks come from `RolePermissionSeeder` and route middleware.
   Existing owner assignments are kept. Modules not in the current table are
   marked `«ASSIGN PROGRAMMER»` for the Project Manager.
5. **[REPLACE] Data Dictionary.** One table per application table (39) plus the
   permission tables, in the manuscript's existing layout:
   Field Name | Description | Data Type | Size | Constraint. Columns, types,
   sizes, nullability, keys and foreign keys come from the migrations. The 7
   framework tables (`cache`, `cache_locks`, `failed_jobs`, `job_batches`,
   `jobs`, `password_reset_tokens`, `sessions`) are named in one sentence, not
   tabulated.
6. **[NEW] ERD source.** A dbdiagram.io (DBML) script generated from the same
   migrations, so the team can redraw the ERD figure from the real schema.
7. **[NEW] Testing Plan**, past tense: the levels used, tools (PHPUnit,
   Vitest, GitHub Actions CI, the manual test guide) and where each level's
   evidence lives.
8. **[NEW] Unit Testing (Appendix S format):** Module Name | Unit Name |
   Date Tested | Test Case ID | Test Case Description | Expected Result |
   Actual Result | Remarks. Representative rows per module, each traceable to a
   named automated test. Date Tested and Actual Result come from the recorded
   run. A summary table reports totals for the full suites (server and
   frontend: passed, skipped, failed).
9. **[NEW] Integration Testing (Appendix T format):** Test Case ID |
   Module 1 | Integration Process | Module 2 | Pre-condition | Result |
   Remarks. Cross-module flows, each backed by a test that ran (e.g.
   registration → admin approval; job posting → match scoring → candidate list;
   job application → notification; tracer survey answer → employment status).
10. **[NEW] Installation Guide** for the Docker setup: requirements, start,
    first run (automatic migrate and seed), addresses, demo accounts, stop and
    reset.
11. **[NEW] User Guide**, one part per role (seven roles), adapted from the
    tester guide into instructional prose. Screenshots are
    `«SCREENSHOT: <screen>»` placeholders.
12. **Recommendations (partial).** Items drawn from verifiable limitations in
    the code and its documentation. The team adds study-based recommendations.

### Templates for data that must come from people

13. **[NEW] Alpha Testing (Appendix U).** The 14-criterion rating form (GUI and
    System Performance; Poor / Fair / Good / Very Good) and a results table
    laid out for the weighted mean and the manuscript's Likert scale
    interpretation (Table 3). No ratings filled.
14. **[NEW] Acceptance Testing (Appendix V).** Project identification and the
    acceptance criteria matrix, with criteria prefilled from the specific
    objectives: one criterion for each of the seven mechanisms listed under
    objective 2 (centralized profiles, electronic tracer surveys, employment
    tracking, AI résumé matching, alumni engagement, skill-gap identification,
    career recommendations), plus objective 3 (best features) and objective 4
    (acceptability). Yes/No, Accept/Reject, comments and signatures blank.
15. **[NEW] Validation Board, Stages 1 to 3.** Template.
16. **[NEW] Conclusion.** One slot per specific objective, each waiting on the
    corresponding finding.
17. **Accomplished forms checklist.** Appendices W, H and AB, and the
    ACM-format (LaTeX) paper required for oral-defense submission (Appendix
    AC). Checklist only.

### Corrections list

18. Approval sheet wording to Appendix AB; references de-duplicated and
    alphabetized (style unchanged pending the MLA/APA decision); "Ms." → "Dr."
    in the Dedication; capitalization of "first" in the Acknowledgment;
    "Edrian L. Quino" in Table 20 → "Edrian L. Quiño" as on the title page.

## Integrity rules

- **No invented results.** Every Actual Result, Remarks and Date Tested cell
  in the unit and integration tables comes from a recorded run. Anything that
  depends on people (ratings, acceptance decisions, survey results,
  conclusions, signatures) is a yellow-highlighted `«TO FILL: …»` placeholder.
- **Tests run on the host only** (Herd PHP; Node for the frontend suite).
  Never inside the Docker `app` container: there, the container's
  `DB_CONNECTION=pgsql` outranks `phpunit.xml` and the suite resets the live
  database.
- **No changes to application code or configuration** as part of this work.
- The master manuscript and both downloads are not modified.

## Verification before hand-off

- No `TBD` or stray placeholder text other than the deliberate `«TO FILL»`,
  `«ASSIGN PROGRAMMER»`, `«SCREENSHOT»` and `«RENUMBER»` markers, which are
  listed in a cover table at the top of the document.
- Every module and unit maps to a real route.
- Every data dictionary column maps to a migration column.
- Every unit and integration row maps to a named test in the recorded run.
- The document opens in Word, and a rendered page check confirms the Appendix J
  formatting.

## Out of scope

- Editing the master manuscript or the questionnaire.
- Converting citation style.
- Producing the ERD figure image, screenshots, the ACM LaTeX paper, or the
  signed forms.
- Collecting alpha, acceptance or survey data.
- Committing any of these files unless asked.

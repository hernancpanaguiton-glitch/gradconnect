# Recommendations

Based on the development and testing of GradConnect, the researchers recommend the following.

1. Link the clearance checklist and the events page from the Graduate Student and Alumni menus. Both already work for graduates, who can view their own clearance and RSVP to published events, but no menu or page currently leads graduates to either. (ClearanceControllerTest; EventControllerTest; resources/js/lib/nav.ts)
2. Add automated tests for the Colleges and Programs administration page, including the rule that a college with graduates or programs cannot be deleted; it is the only module without one. (recorded test run of November 13, 2026)
3. Increase the contrast of buttons in dark mode, where white text on the blue button measures 3.68:1, below the 4.5:1 minimum of the WCAG AA accessibility standard. (dark-mode contrast measurement; resources/css/app.css)
4. Deploy the system on a server or platform that runs containers rather than on a serverless host such as Vercel, because AI matching runs in a background worker and uploaded résumés are stored on the server's own disk. (app/Jobs; FILESYSTEM_DISK=local)
5. Schedule automatic database backups; backups can currently only be made by hand. (routes/console.php)
6. Give each file made by the Résumé Builder a unique name, so that two résumés built in the same second do not share one file. (ResumeBuilderController)
7. Replace the fixed latest year of 2030 in the graduation-year and education-year checks with a limit based on the current year. (StoreEducationRecordRequest; UpdateGraduateProfileRequest)
8. Make the Skill Taxonomy search ignore letter case, as the other searches in the system do. (Admin/SkillTaxonomyController)
9. Check new skill names even when no AI service is configured, so that only legitimate skills can be added to the shared skill list. (SkillSuggestionService)
10. Replace the sample statistics and testimonials on the home page with real figures, and remove the testimonial that names a real company. (resources/js/Pages/Welcome.tsx)
11. Show "GradConnect" instead of "Laravel" in browser tabs on the Docker installation by setting the application name when the pages are built. (Dockerfile; resources/js/app.tsx)
12. Remove the unused Tailwind CSS Vite plugin from the project's dependencies. (package.json)
13. «TO FILL: recommendations from the evaluation results»

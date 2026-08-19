<?php

use App\Http\Controllers\Admin\JobModerationController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Api\JobMatchController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\CandidateMatchController;
use App\Http\Controllers\CareerProgressionController;
use App\Http\Controllers\CareerReadinessController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentHeadController;
use App\Http\Controllers\EducationRecordController;
use App\Http\Controllers\EmployabilityReportController;
use App\Http\Controllers\EmployerFeedbackController;
use App\Http\Controllers\EmploymentRecordController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\GraduateProfileController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\JobAssistController;
use App\Http\Controllers\JobPostingController;
use App\Http\Controllers\JobRecommendationController;
use App\Http\Controllers\LearningResourceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ResumeAnalysisController;
use App\Http\Controllers\ResumeBuilderController;
use App\Http\Controllers\ResumeController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\SkillGapController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\SurveyResponseController;
use App\Http\Controllers\TalentSearchController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Public marketing pages (storyboard Screen 1: landing page "About Us" / "Privacy Policy").
Route::inertia('/about', 'About')->name('about');
Route::inertia('/privacy', 'Privacy')->name('privacy');

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Account profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Topbar global search (Table 5, "Search Bar") — scoped per-permission inside the controller.
    Route::get('/search', [GlobalSearchController::class, 'index'])
        ->middleware('throttle:30,1')->name('search');

    // Shared skill helpers (AI autocomplete + validate) — used by both the
    // graduate profile and the job posting form.
    Route::get('/skills/suggest', [SkillController::class, 'suggest'])
        ->middleware('throttle:30,1')->name('skills.suggest');
    Route::post('/skills/resolve', [SkillController::class, 'resolve'])
        ->middleware('throttle:30,1')->name('skills.resolve');

    // Graduate profile
    Route::middleware('role:alumni|student')->group(function () {
        Route::get('/graduate/profile/edit', [GraduateProfileController::class, 'edit'])->name('graduate.profile.edit');
        Route::patch('/graduate/profile', [GraduateProfileController::class, 'update'])->name('graduate.profile.update');

        // Custom skills added to the graduate's own profile (AI-validated).
        Route::post('/graduate/skills', [SkillController::class, 'store'])->name('skills.store');

        // Education records
        Route::post('/graduate/education', [EducationRecordController::class, 'store'])->name('education.store');
        Route::patch('/graduate/education/{education}', [EducationRecordController::class, 'update'])->name('education.update');
        Route::delete('/graduate/education/{education}', [EducationRecordController::class, 'destroy'])->name('education.destroy');

        // Employment records
        Route::post('/graduate/employment', [EmploymentRecordController::class, 'store'])->name('employment.store');
        Route::patch('/graduate/employment/{employment}', [EmploymentRecordController::class, 'update'])->name('employment.update');
        Route::delete('/graduate/employment/{employment}', [EmploymentRecordController::class, 'destroy'])->name('employment.destroy');

        // Resumes
        Route::get('/graduate/resumes', [ResumeController::class, 'index'])->name('resumes.index');
        Route::post('/graduate/resumes', [ResumeController::class, 'store'])->name('resumes.store');
        Route::delete('/graduate/resumes/{resume}', [ResumeController::class, 'destroy'])->name('resumes.destroy');
        Route::patch('/graduate/resumes/{resume}/primary', [ResumeController::class, 'setPrimary'])->name('resumes.set-primary');

        // Résumé Builder — generate a resume from existing profile data.
        Route::get('/graduate/resume-builder', [ResumeBuilderController::class, 'index'])->name('resume-builder.index');
        Route::post('/graduate/resume-builder', [ResumeBuilderController::class, 'store'])->name('resume-builder.store');

        // Ranked job recommendations
        Route::get('/recommendations', [JobRecommendationController::class, 'index'])->name('recommendations.index');
    });

    // Company (industry partner)
    Route::middleware('role:industry_partner')->group(function () {
        Route::get('/company/edit', [CompanyController::class, 'edit'])->name('company.edit');
        Route::post('/company', [CompanyController::class, 'store'])->name('company.store');
        Route::patch('/company', [CompanyController::class, 'update'])->name('company.update');

        // AI writing assists for the job posting form.
        Route::get('/postings/assist/titles', [JobAssistController::class, 'titles'])
            ->middleware('throttle:30,1')->name('postings.assist.titles');
        Route::post('/postings/assist/description', [JobAssistController::class, 'description'])
            ->middleware('throttle:20,1')->name('postings.assist.description');
        Route::post('/postings/assist/qualifications', [JobAssistController::class, 'qualifications'])
            ->middleware('throttle:20,1')->name('postings.assist.qualifications');

        // Job postings — industry partner management
        Route::get('/postings', [JobPostingController::class, 'index'])->name('postings.index');
        Route::get('/postings/create', [JobPostingController::class, 'create'])->name('postings.create');
        Route::post('/postings', [JobPostingController::class, 'store'])->name('postings.store');
        Route::get('/postings/{posting}/edit', [JobPostingController::class, 'edit'])->name('postings.edit');
        Route::patch('/postings/{posting}', [JobPostingController::class, 'update'])->name('postings.update');
        Route::delete('/postings/{posting}', [JobPostingController::class, 'destroy'])->name('postings.destroy');
        Route::get('/postings/{posting}/candidates', [JobPostingController::class, 'candidates'])->name('postings.candidates');
        Route::get('/postings/{posting}/matches', [CandidateMatchController::class, 'index'])->name('postings.matches');
    });

    // Job board — alumni / students
    Route::get('/jobs', [JobPostingController::class, 'publicIndex'])->name('jobs.index');
    Route::get('/jobs/{posting}', [JobPostingController::class, 'show'])->name('jobs.show');

    // Job applications
    Route::post('/jobs/{job}/apply', [JobApplicationController::class, 'store'])->name('applications.store');
    Route::patch('/applications/{application}/status', [JobApplicationController::class, 'updateStatus'])->name('applications.update-status');
    Route::patch('/applications/{application}/withdraw', [JobApplicationController::class, 'withdraw'])->name('applications.withdraw');
    Route::post('/applications/{application}/feedback', [EmployerFeedbackController::class, 'store'])->name('applications.feedback.store');

    // Surveys
    Route::get('/surveys', [SurveyController::class, 'index'])->name('surveys.index');
    Route::get('/surveys/create', [SurveyController::class, 'create'])->name('surveys.create');
    Route::post('/surveys', [SurveyController::class, 'store'])->name('surveys.store');
    Route::get('/surveys/{survey}/edit', [SurveyController::class, 'edit'])->name('surveys.edit');
    Route::patch('/surveys/{survey}', [SurveyController::class, 'update'])->name('surveys.update');
    Route::delete('/surveys/{survey}', [SurveyController::class, 'destroy'])->name('surveys.destroy');
    Route::get('/surveys/{survey}/results', [SurveyController::class, 'results'])->name('surveys.results');
    Route::post('/surveys/{survey}/remind', [SurveyController::class, 'remind'])->name('surveys.remind');

    // Survey responses
    Route::get('/surveys/{survey}/respond', [SurveyResponseController::class, 'show'])->name('surveys.respond');
    Route::post('/surveys/{survey}/respond', [SurveyResponseController::class, 'store'])->name('surveys.respond.store');

    // Announcements (FR11 Administration) — management-only; other roles
    // read announcements through the existing Notifications inbox.
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('/announcements/{announcement}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
    Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    // Learning resources — Skill Bridge Mitigation (Scope §p.6) + guidance
    // resources (FDD Graduate Student). Managers (AAO/Admin) curate; students
    // browse their own program's catalogue.
    Route::get('/learning-resources', [LearningResourceController::class, 'index'])->name('learning-resources.index');
    Route::get('/learning-resources/create', [LearningResourceController::class, 'create'])->name('learning-resources.create');
    Route::post('/learning-resources', [LearningResourceController::class, 'store'])->name('learning-resources.store');
    Route::get('/learning-resources/{learningResource}/edit', [LearningResourceController::class, 'edit'])->name('learning-resources.edit');
    Route::patch('/learning-resources/{learningResource}', [LearningResourceController::class, 'update'])->name('learning-resources.update');
    Route::delete('/learning-resources/{learningResource}', [LearningResourceController::class, 'destroy'])->name('learning-resources.destroy');

    // Employability report
    Route::get('/reports/employability', [EmployabilityReportController::class, 'index'])->name('reports.employability');

    // AI résumé analysis (real feature for graduates).
    Route::get('/resume-analysis', [ResumeAnalysisController::class, 'index'])
        ->middleware('role:alumni|student')->name('resume-analysis');

    // Individual skill-gap analysis (manuscript Figure 29 — Alumni/Graduate Student only).
    Route::get('/skill-gap', [SkillGapController::class, 'index'])
        ->middleware('role:alumni|student')->name('skill-gap');

    // Employment-history timeline (FR8 Employment Tracking).
    Route::get('/career-progression', [CareerProgressionController::class, 'index'])
        ->middleware('role:alumni|student')->name('career-progression');

    // Career Readiness Assessment (FDD Graduate Student; SAO aggregate view).
    Route::get('/career-readiness', [CareerReadinessController::class, 'index'])->name('career-readiness');

    // Feature-screen shells (design shells so every sidebar link resolves).
    Route::inertia('/messages', 'Messages')->name('messages');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::inertia('/settings', 'Settings')->name('settings');
    Route::get('/applications', [JobApplicationController::class, 'index'])->name('applications.index');
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::inertia('/events', 'Events')->name('events');
    Route::inertia('/scholarships', 'Scholarships')->name('scholarships');
    Route::inertia('/clearance', 'Clearance')->name('clearance');
    Route::get('/talent-search', [TalentSearchController::class, 'index'])
        ->middleware('permission:candidates.search')->name('talent-search');

    // Department head / dean — self-assign their college
    Route::middleware('role:department_head')->group(function () {
        Route::patch('/department-head/college', [DepartmentHeadController::class, 'updateCollege'])
            ->name('department-head.college.update');
    });

    // Read-only candidate profile + résumé (employers reviewing candidates)
    Route::middleware('permission:candidates.view_resumes')->group(function () {
        Route::get('/candidates/{graduateProfile}', [CandidateController::class, 'show'])->name('candidates.show');
        Route::get('/candidates/{graduateProfile}/data', [CandidateController::class, 'data'])->name('candidates.data');
        Route::get('/candidates/resume/{resume}', [CandidateController::class, 'resume'])->name('candidates.resume');
    });

    // AI matching — trigger + poll status
    Route::prefix('api')->name('api.')->middleware('permission:matching.trigger')->group(function () {
        Route::post('/jobs/{posting}/rematch', [JobMatchController::class, 'rematchJob'])->name('jobs.rematch.store');
        Route::get('/jobs/{posting}/rematch', [JobMatchController::class, 'jobStatus'])->name('jobs.rematch.show');
        Route::post('/me/rematch', [JobMatchController::class, 'rematchProfile'])->name('me.rematch.store');
        Route::get('/me/rematch', [JobMatchController::class, 'profileStatus'])->name('me.rematch.show');
    });

    // Admin
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
        Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        Route::get('/roles', [RolePermissionController::class, 'index'])->name('roles.index');
        Route::post('/roles', [RolePermissionController::class, 'store'])->name('roles.store');
        Route::delete('/roles/{role}', [RolePermissionController::class, 'destroy'])->name('roles.destroy');
        Route::patch('/roles/{role}/permissions', [RolePermissionController::class, 'updatePermissions'])->name('roles.permissions.update');

        // Job moderation — act on any partner's posting, not just your own.
        Route::get('/jobs', [JobModerationController::class, 'index'])->name('jobs');
        Route::patch('/jobs/{posting}/status', [JobModerationController::class, 'updateStatus'])->name('jobs.update-status');
        Route::delete('/jobs/{posting}', [JobModerationController::class, 'destroy'])->name('jobs.destroy');

        // Admin feature-screen shells.
        Route::inertia('/audit-logs', 'Admin/AuditLogs')->name('audit-logs');
    });
});

require __DIR__.'/auth.php';

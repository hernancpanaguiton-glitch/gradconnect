<?php

use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\JobMatchController;
use App\Http\Controllers\CandidateMatchController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EducationRecordController;
use App\Http\Controllers\EmployabilityReportController;
use App\Http\Controllers\EmploymentRecordController;
use App\Http\Controllers\GraduateProfileController;
use App\Http\Controllers\JobApplicationController;
use App\Http\Controllers\JobPostingController;
use App\Http\Controllers\JobRecommendationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResumeController;
use App\Http\Controllers\SurveyController;
use App\Http\Controllers\SurveyResponseController;
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

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Account profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Graduate profile
    Route::middleware('role:alumni|student')->group(function () {
        Route::get('/graduate/profile/edit', [GraduateProfileController::class, 'edit'])->name('graduate.profile.edit');
        Route::patch('/graduate/profile', [GraduateProfileController::class, 'update'])->name('graduate.profile.update');

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

        // Ranked job recommendations
        Route::get('/recommendations', [JobRecommendationController::class, 'index'])->name('recommendations.index');
    });

    // Company (industry partner)
    Route::middleware('role:industry_partner')->group(function () {
        Route::get('/company/edit', [CompanyController::class, 'edit'])->name('company.edit');
        Route::post('/company', [CompanyController::class, 'store'])->name('company.store');
        Route::patch('/company', [CompanyController::class, 'update'])->name('company.update');

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

    // Surveys
    Route::get('/surveys', [SurveyController::class, 'index'])->name('surveys.index');
    Route::get('/surveys/create', [SurveyController::class, 'create'])->name('surveys.create');
    Route::post('/surveys', [SurveyController::class, 'store'])->name('surveys.store');
    Route::get('/surveys/{survey}/edit', [SurveyController::class, 'edit'])->name('surveys.edit');
    Route::patch('/surveys/{survey}', [SurveyController::class, 'update'])->name('surveys.update');
    Route::delete('/surveys/{survey}', [SurveyController::class, 'destroy'])->name('surveys.destroy');
    Route::get('/surveys/{survey}/results', [SurveyController::class, 'results'])->name('surveys.results');

    // Survey responses
    Route::get('/surveys/{survey}/respond', [SurveyResponseController::class, 'show'])->name('surveys.respond');
    Route::post('/surveys/{survey}/respond', [SurveyResponseController::class, 'store'])->name('surveys.respond.store');

    // Employability report
    Route::get('/reports/employability', [EmployabilityReportController::class, 'index'])->name('reports.employability');

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
    });
});

require __DIR__.'/auth.php';

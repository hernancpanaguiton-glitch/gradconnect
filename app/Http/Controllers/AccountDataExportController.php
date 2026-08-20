<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AccountDataExportController extends Controller
{
    /**
     * Self-service data export (Data Privacy Act of 2012 / RA 10173 —
     * "right to data portability"). Every user's own account + profile
     * data as a downloadable JSON file — account deletion already exists
     * at the Breeze /profile page (topbar "My Profile"), so this is the
     * one piece of that requirement that didn't already exist somewhere.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $profile = $user->graduateProfile()
            ->with(['educationRecords', 'employmentRecords', 'skills', 'resumes', 'jobApplications.jobPosting'])
            ->first();

        $data = [
            'account' => $user->only(['id', 'first_name', 'last_name', 'email', 'id_number', 'status', 'created_at']),
            'roles' => $user->getRoleNames(),
            'profile' => $profile?->only([
                'program', 'student_number', 'graduation_year', 'expected_graduation_year',
                'headline', 'summary', 'phone', 'address', 'city', 'linkedin_url',
                'current_employment_status', 'willing_to_relocate',
            ]),
            'education' => $profile?->educationRecords->makeHidden(['id', 'graduate_profile_id', 'created_at', 'updated_at'])->values(),
            'employment' => $profile?->employmentRecords->makeHidden(['id', 'graduate_profile_id', 'created_at', 'updated_at'])->values(),
            'skills' => $profile?->skillNames() ?? [],
            'resumes' => $profile?->resumes->map(fn ($resume) => [
                'filename' => $resume->original_filename,
                'source' => $resume->source,
                'uploaded_at' => $resume->created_at,
            ])->values(),
            'job_applications' => $profile?->jobApplications->map(fn ($application) => [
                'job_title' => $application->jobPosting?->title,
                'status' => $application->status,
                'applied_at' => $application->applied_at,
            ])->values(),
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        return response()->streamDownload(function () use ($json) {
            echo $json;
        }, 'my-gradconnect-data-'.now()->format('Y-m-d').'.json', ['Content-Type' => 'application/json']);
    }
}

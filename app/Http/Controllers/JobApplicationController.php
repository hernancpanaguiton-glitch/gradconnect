<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Notifications\ApplicationReceived;
use App\Notifications\ApplicationStatusUpdated;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JobApplicationController extends Controller
{
    /**
     * The applicant's own application list + status (FR6 "monitor application
     * status"). This is what ApplicationStatusUpdated notifications link to.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile;

        $applications = $profile
            ? $profile->jobApplications()
                ->with(['jobPosting.company'])
                ->latest('applied_at')
                ->get()
            : collect();

        return Inertia::render('Applications', [
            'hasProfile' => $profile !== null,
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'shortlisted' => $applications->where('status', 'shortlisted')->count(),
                'hired' => $applications->where('status', 'hired')->count(),
            ],
        ]);
    }

    /**
     * Apply to a job posting.
     */
    public function store(Request $request, JobPosting $job): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('jobs.apply'), 403);

        // A closed, draft, or moderated-away posting must not keep collecting
        // applications just because someone kept the URL.
        abort_unless($job->status === 'open', 422, 'This position is no longer accepting applications.');

        $profile = $request->user()->graduateProfile;

        abort_if($profile === null, 422, 'You must have a graduate profile to apply.');

        // Validated only once the applicant's own profile is known: a bare
        // exists:resumes,id let anyone attach somebody else's résumé, which
        // the employer's candidate page would then happily serve.
        $request->validate([
            'resume_id' => [
                'nullable',
                Rule::exists('resumes', 'id')->where('graduate_profile_id', $profile->id),
            ],
            'cover_letter' => ['nullable', 'string', 'max:5000'],
        ]);

        $existing = $job->applications()->where('graduate_profile_id', $profile->id)->exists();
        abort_if($existing, 422, 'You have already applied to this position.');

        $application = $job->applications()->create([
            'graduate_profile_id' => $profile->id,
            'resume_id' => $request->resume_id,
            'cover_letter' => $request->cover_letter,
            'status' => 'submitted',
            'applied_at' => now(),
        ]);

        // Notify the employer who posted the role.
        $job->postedBy?->notify(new ApplicationReceived($application));

        return back()->with('success', 'Application submitted.');
    }

    /**
     * Update the status of a job application (partner action).
     */
    public function updateStatus(Request $request, JobApplication $application): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:under_review,shortlisted,rejected,hired'],
        ]);

        $posting = $application->jobPosting;

        abort_unless(
            $posting->posted_by_user_id === $request->user()->id
                || $request->user()->hasPermissionTo('job_postings.moderate'),
            403,
        );

        // The applicant pulled out; an employer must not be able to drag them
        // back into the pipeline (and notify them about it).
        if ($application->status === 'withdrawn') {
            throw ValidationException::withMessages([
                'status' => 'This applicant withdrew their application.',
            ]);
        }

        // Re-selecting the status a row already has is a no-op, not an
        // update worth emailing the applicant about.
        if ($application->status === $request->status) {
            return back();
        }

        $application->update(['status' => $request->status]);

        // Notify the applicant of the status change.
        $application->graduateProfile->user->notify(new ApplicationStatusUpdated($application));

        return back()->with('success', 'Application status updated.');
    }

    /**
     * Withdraw an application (applicant action).
     */
    public function withdraw(Request $request, JobApplication $application): RedirectResponse
    {
        $profile = $request->user()->graduateProfile;

        abort_unless(
            $profile && $application->graduate_profile_id === $profile->id,
            403,
        );

        if (! in_array($application->status, JobApplication::WITHDRAWABLE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => 'This application can no longer be withdrawn.',
            ]);
        }

        $application->update(['status' => 'withdrawn']);

        return back()->with('success', 'Application withdrawn.');
    }
}

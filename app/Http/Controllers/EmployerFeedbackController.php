<?php

namespace App\Http\Controllers;

use App\Models\EmployerFeedback;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployerFeedbackController extends Controller
{
    /**
     * Applications a hiring decision has already been made on — feedback
     * before that point would just be a guess at competencies.
     */
    private const RATABLE_STATUSES = ['hired', 'rejected'];

    /**
     * Submit (or revise) employer feedback on a candidate's competencies
     * (FDD Industry Partner "provide employer feedback on graduate
     * competencies"; AI architecture Layer 5 feedback loop). The table and
     * model already existed — this is the first thing that writes to them.
     */
    public function store(Request $request, JobApplication $application): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('employer_feedback.submit'), 403);

        $posting = $application->jobPosting;

        abort_unless(
            $posting->posted_by_user_id === $request->user()->id
                || $request->user()->hasPermissionTo('job_postings.moderate'),
            403,
        );

        abort_unless(
            in_array($application->status, self::RATABLE_STATUSES, true),
            422,
            'Feedback can only be submitted once a hiring decision has been made.',
        );

        $request->validate([
            'overall_rating' => ['required', 'integer', 'between:1,5'],
            'competency_ratings' => ['nullable', 'array'],
            'competency_ratings.*' => ['integer', 'between:1,5'],
            'comments' => ['nullable', 'string', 'max:2000'],
        ]);

        EmployerFeedback::updateOrCreate(
            ['job_application_id' => $application->id],
            [
                'company_id' => $posting->company_id,
                'graduate_profile_id' => $application->graduate_profile_id,
                'submitted_by_user_id' => $request->user()->id,
                'overall_rating' => $request->integer('overall_rating'),
                'competency_ratings' => $request->input('competency_ratings'),
                'comments' => $request->input('comments'),
            ],
        );

        return back()->with('success', 'Feedback submitted.');
    }
}

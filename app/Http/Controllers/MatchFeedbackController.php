<?php

namespace App\Http\Controllers;

use App\Models\JobMatchResult;
use App\Models\MatchFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MatchFeedbackController extends Controller
{
    /**
     * Thumbs-up/down on a job recommendation (AI architecture Layer 5
     * "Feedback & Learning Loop"). Only the graduate the match belongs to
     * can rate it.
     */
    public function store(Request $request, JobMatchResult $jobMatchResult): RedirectResponse
    {
        $profile = $request->user()->graduateProfile;
        abort_unless($profile && $jobMatchResult->graduate_profile_id === $profile->id, 403);

        $data = $request->validate(['rating' => ['required', 'in:helpful,not_helpful']]);

        MatchFeedback::updateOrCreate(
            ['job_match_result_id' => $jobMatchResult->id, 'user_id' => $request->user()->id],
            ['rating' => $data['rating']],
        );

        return back()->with('success', 'Thanks for the feedback.');
    }
}

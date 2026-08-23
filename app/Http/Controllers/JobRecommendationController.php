<?php

namespace App\Http\Controllers;

use App\Models\JobMatchResult;
use App\Models\Setting;
use App\Services\LearningResourceMatcher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobRecommendationController extends Controller
{
    public function __construct(private readonly LearningResourceMatcher $resourceMatcher) {}

    /**
     * Show the graduate's ranked job recommendations.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile;

        // Admin-configurable noise floor (Setting 'matching_min_fit_score'):
        // the feedback loop's threshold-tuning lever — if match_feedback
        // shows low-scored matches are rated unhelpful, admin can raise this
        // to stop surfacing them, without any code change.
        $minFitScore = Setting::getInt('matching_min_fit_score', 0);

        $matches = $profile
            ? $profile->matchResults()
                ->with(['jobPosting.company'])
                ->whereHas('jobPosting', fn ($query) => $query->where('status', 'open'))
                ->where(fn ($query) => $query->whereNull('fit_score')->orWhere('fit_score', '>=', $minFitScore))
                ->orderByRaw('fit_score is null')
                ->orderByDesc('fit_score')
                ->orderByDesc('similarity')
                ->get()
            : collect();

        $myFeedback = $profile
            ? $profile->user->matchFeedback()->pluck('rating', 'job_match_result_id')
            : collect();

        $matches->each(function (JobMatchResult $match) use ($myFeedback) {
            $match->learning_resources = $this->resourceMatcher->match($match->skill_gaps ?? []);
            $match->my_feedback = $myFeedback->get($match->id);
        });

        return Inertia::render('Recommendations/Index', [
            'matches' => $matches,
            'hasProfile' => $profile !== null,
        ]);
    }
}

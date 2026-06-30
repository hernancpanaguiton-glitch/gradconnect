<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobRecommendationController extends Controller
{
    /**
     * Show the graduate's ranked job recommendations.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile;

        $matches = $profile
            ? $profile->matchResults()
                ->with(['jobPosting.company'])
                ->whereHas('jobPosting', fn ($query) => $query->where('status', 'open'))
                ->orderByRaw('fit_score is null')
                ->orderByDesc('fit_score')
                ->orderByDesc('similarity')
                ->get()
            : collect();

        return Inertia::render('Recommendations/Index', [
            'matches' => $matches,
            'hasProfile' => $profile !== null,
        ]);
    }
}

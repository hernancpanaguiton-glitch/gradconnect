<?php

namespace App\Http\Controllers;

use App\Http\Presenters\CandidatePresenter;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateMatchController extends Controller
{
    /**
     * Show the AI-ranked candidates for a job posting.
     */
    public function index(Request $request, JobPosting $posting): Response
    {
        $this->authorize('update', $posting);

        $presenter = new CandidatePresenter($request->user());

        $matches = $posting->matchResults()
            ->with(['graduateProfile.user', 'graduateProfile.department', 'resume'])
            ->orderByRaw('fit_score is null')
            ->orderByDesc('fit_score')
            ->orderByDesc('similarity')
            ->get()
            ->map(fn (JobMatchResult $match) => $presenter->match($match))
            ->values();

        return Inertia::render('Postings/Matches', [
            'posting' => $posting,
            'matches' => $matches,
        ]);
    }
}

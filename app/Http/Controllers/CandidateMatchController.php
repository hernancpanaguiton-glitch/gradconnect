<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use Inertia\Inertia;
use Inertia\Response;

class CandidateMatchController extends Controller
{
    /**
     * Show the AI-ranked candidates for a job posting.
     */
    public function index(JobPosting $posting): Response
    {
        $this->authorize('update', $posting);

        $matches = $posting->matchResults()
            ->with(['graduateProfile.user', 'resume'])
            ->orderByRaw('fit_score is null')
            ->orderByDesc('fit_score')
            ->orderByDesc('similarity')
            ->get();

        return Inertia::render('Postings/Matches', [
            'posting' => $posting,
            'matches' => $matches,
        ]);
    }
}

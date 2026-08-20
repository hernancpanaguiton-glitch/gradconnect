<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Resume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformStatusController extends Controller
{
    /**
     * Platform performance monitoring (FDD Admin "monitor platform
     * performance"). Real, computable signals only — queue depth, failed
     * jobs, and AI success rates derived from embedding_status /
     * scored_by. Deliberately omits "response times": there's no request
     * timing instrumentation anywhere in this codebase, and fabricating a
     * number would misrepresent it as measured.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        $embeddingTotal = Resume::whereIn('embedding_status', ['done', 'failed'])->count()
            + JobPosting::whereIn('embedding_status', ['done', 'failed'])->count();
        $embeddingDone = Resume::where('embedding_status', 'done')->count()
            + JobPosting::where('embedding_status', 'done')->count();

        $matchTotal = JobMatchResult::count();
        $matchScored = JobMatchResult::whereNotNull('scored_by')->count();

        return Inertia::render('Admin/PlatformStatus', [
            'queueDepth' => DB::table('jobs')->count(),
            'failedJobsCount' => DB::table('failed_jobs')->count(),
            'embeddingSuccessRate' => $embeddingTotal > 0 ? (int) round($embeddingDone / $embeddingTotal * 100) : null,
            'matchScoringSuccessRate' => $matchTotal > 0 ? (int) round($matchScored / $matchTotal * 100) : null,
            'recentFailedJobs' => DB::table('failed_jobs')
                ->latest('failed_at')
                ->limit(5)
                ->get(['uuid', 'connection', 'queue', 'failed_at'])
                ->map(fn ($job) => (array) $job)
                ->all(),
        ]);
    }
}

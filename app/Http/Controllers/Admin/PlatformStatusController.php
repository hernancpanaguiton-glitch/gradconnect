<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\MatchFeedback;
use App\Models\Resume;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformStatusController extends Controller
{
    /**
     * Platform performance monitoring (FDD Admin "monitor platform
     * performance") plus the AI feedback loop's accuracy signals (AI
     * architecture Layer 5). Real, computable signals only — queue depth,
     * failed jobs, AI success rates, and match-feedback/hire-outcome
     * accuracy. Deliberately omits "response times": there's no request
     * timing instrumentation anywhere in this codebase, and fabricating a
     * number would misrepresent it as measured. There is likewise no
     * literal model retraining with an API-based LLM — see the admin
     * "matching_min_fit_score" setting for the actual tuning lever this
     * data is meant to inform.
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
            ...$this->queueHealth(),
            'embeddingSuccessRate' => $embeddingTotal > 0 ? (int) round($embeddingDone / $embeddingTotal * 100) : null,
            'matchScoringSuccessRate' => $matchTotal > 0 ? (int) round($matchScored / $matchTotal * 100) : null,
            'recentFailedJobs' => DB::table('failed_jobs')
                ->latest('failed_at')
                ->limit(5)
                ->get(['uuid', 'connection', 'queue', 'failed_at'])
                ->map(fn ($job) => (array) $job)
                ->all(),
            ...$this->recommendationAccuracy(),
        ]);
    }

    /**
     * Detect a queue with work but no consumer.
     *
     * Every AI job and every notification is ShouldQueue, so with no worker
     * running nothing embeds, nothing scores, and no mail is delivered — all
     * silently. Surfacing it here turns a mystifying "nothing happens" into a
     * stated cause.
     *
     * @return array<string, mixed>
     */
    private function queueHealth(): array
    {
        $oldestAvailableAt = DB::table('jobs')->min('available_at');
        $reserved = DB::table('jobs')->whereNotNull('reserved_at')->count();

        $waitingMinutes = $oldestAvailableAt === null
            ? null
            : (int) floor((time() - (int) $oldestAvailableAt) / 60);

        return [
            'queueReserved' => $reserved,
            'queueOldestWaitMinutes' => $waitingMinutes,
            // Work queued, nothing picked up, and it has been sitting a while:
            // that is a stopped worker rather than normal backlog.
            'queueStalled' => $waitingMinutes !== null && $waitingMinutes >= 2 && $reserved === 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function recommendationAccuracy(): array
    {
        $feedbackTotal = MatchFeedback::count();
        $feedbackHelpful = MatchFeedback::where('rating', 'helpful')->count();

        $rows = JobMatchResult::query()
            ->join('match_feedback', 'match_feedback.job_match_result_id', '=', 'job_match_results.id')
            ->whereNotNull('job_match_results.scored_by')
            ->get(['job_match_results.scored_by', 'match_feedback.rating']);

        $byProvider = [];
        foreach ($rows as $row) {
            $byProvider[$row->scored_by]['total'] = ($byProvider[$row->scored_by]['total'] ?? 0) + 1;
            if ($row->rating === 'helpful') {
                $byProvider[$row->scored_by]['helpful'] = ($byProvider[$row->scored_by]['helpful'] ?? 0) + 1;
            }
        }

        $helpfulRateByProvider = collect($byProvider)->map(fn ($stats, $provider) => [
            'provider' => $provider,
            'total' => $stats['total'],
            'helpfulRate' => (int) round(($stats['helpful'] ?? 0) / $stats['total'] * 100),
        ])->values()->all();

        // Calibration check: for candidates who were actually hired, does a
        // higher AI fit_score line up with a higher employer rating?
        $hiredPairs = JobApplication::where('status', 'hired')
            ->whereHas('employerFeedback')
            ->with('employerFeedback')
            ->get()
            ->map(function (JobApplication $application) {
                $match = JobMatchResult::where('job_posting_id', $application->job_posting_id)
                    ->where('graduate_profile_id', $application->graduate_profile_id)
                    ->first();

                return $match?->fit_score !== null
                    ? ['fit_score' => $match->fit_score, 'employer_rating' => $application->employerFeedback->overall_rating]
                    : null;
            })
            ->filter()
            ->values();

        return [
            'feedbackTotal' => $feedbackTotal,
            'feedbackHelpfulRate' => $feedbackTotal > 0 ? (int) round($feedbackHelpful / $feedbackTotal * 100) : null,
            'helpfulRateByProvider' => $helpfulRateByProvider,
            'hireCalibration' => [
                'sampleSize' => $hiredPairs->count(),
                'avgFitScore' => $hiredPairs->isNotEmpty() ? round($hiredPairs->avg('fit_score'), 1) : null,
                'avgEmployerRating' => $hiredPairs->isNotEmpty() ? round($hiredPairs->avg('employer_rating'), 1) : null,
            ],
        ];
    }
}

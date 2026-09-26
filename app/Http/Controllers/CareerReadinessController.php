<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CareerReadinessController extends Controller
{
    /**
     * Score bands, checked in this (highest-first) order.
     */
    private const BANDS = [
        71 => 'Career Ready',
        41 => 'Developing',
        0 => 'Needs Improvement',
    ];

    /**
     * Career Readiness Assessment (FDD Graduate Student; storyboard Screen 11
     * SAO "Career Readiness"). Reuses the survey engine — a readiness
     * assessment is just a Survey with type='readiness' whose "rating"
     * questions (1-5) are scored into a 0-100% band. Students see their own
     * result; SAO/AAO/Admin see the aggregate across all respondents.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAggregate = $user->hasPermissionTo('student_analytics.view') || $user->hasPermissionTo('surveys.manage');
        $canParticipate = $user->hasPermissionTo('assessments.participate');

        abort_unless($canViewAggregate || $canParticipate, 403);

        return Inertia::render('CareerReadiness', $canViewAggregate ? $this->aggregateView() : $this->personalView($user));
    }

    /**
     * @return array<string, mixed>
     */
    private function aggregateView(): array
    {
        $surveyIds = Survey::where('type', 'readiness')->pluck('id');

        $responses = SurveyResponse::whereIn('survey_id', $surveyIds)
            ->where('status', 'submitted')
            ->with(['answers', 'survey.questions'])
            ->get();

        $scores = $responses
            ->map(fn (SurveyResponse $response) => $this->score($response->survey, $response))
            ->filter(fn (array $result) => $result['score'] !== null);

        $distribution = ['Career Ready' => 0, 'Developing' => 0, 'Needs Improvement' => 0];
        foreach ($scores as $result) {
            $distribution[$result['band']]++;
        }

        return [
            'mode' => 'aggregate',
            'totalRespondents' => $scores->count(),
            'averageScore' => $scores->isEmpty() ? null : (int) round($scores->avg('score')),
            'distribution' => $distribution,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function personalView(User $user): array
    {
        $surveyIds = Survey::where('type', 'readiness')->pluck('id');

        $myResponse = SurveyResponse::whereIn('survey_id', $surveyIds)
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->with(['answers', 'survey.questions'])
            ->latest('submitted_at')
            ->first();

        if ($myResponse) {
            $result = $this->score($myResponse->survey, $myResponse);

            return [
                'mode' => 'personal',
                'hasResult' => true,
                'score' => $result['score'],
                'band' => $result['band'],
                'surveyTitle' => $myResponse->survey->title,
                'openSurvey' => null,
            ];
        }

        $openSurvey = Survey::where('type', 'readiness')
            ->open()
            ->visibleTo($user)
            ->latest()
            ->first();

        return [
            'mode' => 'personal',
            'hasResult' => false,
            'score' => null,
            'band' => null,
            'surveyTitle' => null,
            'openSurvey' => $openSurvey ? ['id' => $openSurvey->id, 'title' => $openSurvey->title] : null,
        ];
    }

    /**
     * @return array{score: int|null, band: string|null}
     */
    private function score(Survey $survey, SurveyResponse $response): array
    {
        $ratingQuestionIds = $survey->questions->where('type', 'rating')->pluck('id');
        $ratingAnswers = $response->answers->whereIn('survey_question_id', $ratingQuestionIds);

        if ($ratingAnswers->isEmpty()) {
            return ['score' => null, 'band' => null];
        }

        // Rows stored before survey answers were validated can hold anything
        // at all, and a single 47 would report a 940%-ready graduate. Clamp
        // each answer to the 1-5 scale the band thresholds assume.
        $sum = $ratingAnswers->sum(function ($answer): int {
            $value = is_array($answer->value) ? null : (int) $answer->value;

            return max(1, min(5, $value ?? 1));
        });
        $max = $ratingAnswers->count() * 5;
        $score = (int) min(100, round($sum / $max * 100));

        foreach (self::BANDS as $threshold => $band) {
            if ($score >= $threshold) {
                return ['score' => $score, 'band' => $band];
            }
        }

        return ['score' => $score, 'band' => 'Needs Improvement'];
    }
}

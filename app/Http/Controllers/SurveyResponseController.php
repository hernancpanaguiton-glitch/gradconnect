<?php

namespace App\Http\Controllers;

use App\Models\GraduateProfile;
use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SurveyResponseController extends Controller
{
    /**
     * Show the survey response form.
     */
    public function show(Request $request, Survey $survey): Response
    {
        abort_unless($survey->isOpen(), 422, 'This survey is not currently open.');

        $user = $request->user();
        $profile = $user->graduateProfile;

        $response = SurveyResponse::firstOrCreate(
            [
                'survey_id' => $survey->id,
                'user_id' => $user->id,
            ],
            [
                'graduate_profile_id' => $profile?->id,
                'status' => 'in_progress',
            ],
        );

        $survey->load('questions');

        return Inertia::render('Surveys/Respond', [
            'survey' => $survey,
            'existingAnswers' => $response->load('answers')->answers,
        ]);
    }

    /**
     * Save and submit a survey response.
     */
    public function store(Request $request, Survey $survey): RedirectResponse
    {
        abort_unless($survey->isOpen(), 422, 'This survey is not currently open.');

        $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $user = $request->user();
        $profile = $user->graduateProfile;

        $response = SurveyResponse::updateOrCreate(
            [
                'survey_id' => $survey->id,
                'user_id' => $user->id,
            ],
            [
                'graduate_profile_id' => $profile?->id,
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        foreach ($request->answers as $questionId => $value) {
            $response->answers()->updateOrCreate(
                ['survey_question_id' => $questionId],
                ['value' => $value],
            );
        }

        if ($profile) {
            $this->applyMapsToWriteBack($profile, $survey, $request->answers);
        }

        return redirect()->route('surveys.index')->with('success', 'Survey submitted. Thank you!');
    }

    /**
     * Feed tracer-survey answers back into employment tracking (FR7 →
     * FR8), instead of leaving them to sit only in survey_answers.
     * SurveyQuestion.maps_to was stored but never read before this.
     *
     * @param  array<int|string, mixed>  $answers  Keyed by question ID.
     */
    private function applyMapsToWriteBack(GraduateProfile $profile, Survey $survey, array $answers): void
    {
        $questions = $survey->questions()->whereNotNull('maps_to')->get(['id', 'maps_to']);

        if ($questions->isEmpty()) {
            return;
        }

        $mapped = new Collection();
        foreach ($questions as $question) {
            if (array_key_exists($question->id, $answers)) {
                $mapped[$question->maps_to] = $answers[$question->id];
            }
        }

        if ($mapped->isEmpty()) {
            return;
        }

        if ($mapped->has('employment_status')) {
            $status = $mapped->get('employment_status');
            if (in_array($status, ['employed', 'unemployed', 'self_employed', 'further_study', 'not_seeking'], true)) {
                $profile->update(['current_employment_status' => $status]);
            }
        }

        $companyName = $mapped->get('current_employer');
        $jobTitle = $mapped->get('job_title');
        $industry = $mapped->get('industry');

        if ($companyName === null && $jobTitle === null && $industry === null) {
            return;
        }

        $record = $profile->employmentRecords()->where('is_current', true)->latest('start_date')->first();

        if ($record === null) {
            // company_name and job_title are NOT NULL columns — only start a
            // new record when this survey actually supplied both.
            if ($companyName === null || $jobTitle === null) {
                return;
            }

            $record = $profile->employmentRecords()->make([
                'employment_type' => 'full_time',
                'is_current' => true,
                'start_date' => now()->toDateString(),
            ]);
        }

        if ($companyName !== null) {
            $record->company_name = $companyName;
        }
        if ($jobTitle !== null) {
            $record->job_title = $jobTitle;
        }
        if ($industry !== null) {
            $record->industry = $industry;
        }

        $record->save();
    }
}

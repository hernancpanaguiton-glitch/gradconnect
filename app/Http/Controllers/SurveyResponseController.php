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
        $this->assertCanRespond($request, $survey);

        $user = $request->user();

        // Read-only: a GET must not create state. Previously this used
        // firstOrCreate, so merely opening a survey created an in_progress
        // row and inflated the response count shown to survey managers.
        $existing = SurveyResponse::where('survey_id', $survey->id)
            ->where('user_id', $user->id)
            ->first();

        $survey->load('questions');

        return Inertia::render('Surveys/Respond', [
            'survey' => $survey,
            'existingAnswers' => $existing ? $existing->load('answers')->answers : [],
        ]);
    }

    /**
     * Save and submit a survey response.
     */
    public function store(Request $request, Survey $survey): RedirectResponse
    {
        $this->assertCanRespond($request, $survey);

        $request->validate([
            'answers' => ['required', 'array'],
        ]);

        // Only accept answers for questions that actually belong to THIS
        // survey. Without this, a crafted payload could write answers keyed
        // to another survey's question IDs, which then flow into
        // applyMapsToWriteBack() and corrupt employment records.
        $ownQuestionIds = $survey->questions()->pluck('id')->all();
        $submitted = array_keys($request->answers);
        $unknown = array_diff($submitted, $ownQuestionIds);

        abort_unless(
            $unknown === [],
            422,
            'This submission references questions that do not belong to this survey.',
        );

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
     * Guard both the form and the submission.
     *
     * Survey targeting (target_role / target_graduation_year) was previously
     * enforced only in SurveyController@index, so it could be bypassed by
     * navigating straight to /surveys/{id}/respond. Survey managers are
     * excluded here so that who MAY respond matches who gets invited by
     * Survey::eligibleRespondents() — otherwise staff answers would pollute
     * the tracer statistics those same staff then report on.
     */
    private function assertCanRespond(Request $request, Survey $survey): void
    {
        abort_unless($survey->isOpen(), 422, 'This survey is not currently open.');

        $user = $request->user();

        abort_unless($user->hasPermissionTo('surveys.respond'), 403);
        abort_if($user->hasPermissionTo('surveys.manage'), 403, 'Survey managers do not submit responses.');

        abort_unless(
            Survey::whereKey($survey->id)->visibleTo($user)->exists(),
            403,
            'This survey is not addressed to you.',
        );
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

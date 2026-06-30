<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'surveyResponse' => $response->load('answers'),
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
            'answers.*.question_id' => ['required', 'exists:survey_questions,id'],
            'answers.*.value' => ['nullable'],
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

        foreach ($request->answers as $answerData) {
            $response->answers()->updateOrCreate(
                ['survey_question_id' => $answerData['question_id']],
                ['value' => $answerData['value']],
            );
        }

        return redirect()->route('surveys.index')->with('success', 'Survey submitted. Thank you!');
    }
}

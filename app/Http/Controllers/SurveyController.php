<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSurveyRequest;
use App\Models\Survey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    /**
     * List surveys — all for managers, open ones for respondents.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Survey::query()->latest();

        if (! $user->hasPermissionTo('surveys.manage')) {
            $query->open();
        }

        $surveys = $query->withCount('responses')->get();

        // Append user's own response status for respondents
        if (! $user->hasPermissionTo('surveys.manage')) {
            $surveys->each(function (Survey $survey) use ($user): void {
                $survey->user_response = $survey->responses()->where('user_id', $user->id)->first(['id', 'status']);
            });
        }

        return Inertia::render('Surveys/Index', [
            'surveys' => $surveys,
            'canManage' => $user->hasPermissionTo('surveys.manage'),
        ]);
    }

    /**
     * Show the create survey form.
     */
    public function create(): Response
    {
        $this->authorize('create', Survey::class);

        return Inertia::render('Surveys/Create');
    }

    /**
     * Store a new survey with its questions.
     */
    public function store(StoreSurveyRequest $request): RedirectResponse
    {
        $this->authorize('create', Survey::class);

        $survey = Survey::create([
            ...$request->except('questions'),
            'created_by_user_id' => $request->user()->id,
        ]);

        foreach ($request->input('questions', []) as $index => $questionData) {
            $survey->questions()->create([
                'order' => $index + 1,
                'prompt' => $questionData['prompt'],
                'type' => $questionData['type'],
                'options' => $questionData['options'] ?? null,
                'is_required' => $questionData['is_required'] ?? false,
                'maps_to' => $questionData['maps_to'] ?? null,
            ]);
        }

        return redirect()->route('surveys.index')->with('success', 'Survey created.');
    }

    /**
     * Show the edit form for a survey.
     */
    public function edit(Survey $survey): Response
    {
        $this->authorize('update', $survey);

        $survey->load('questions');

        return Inertia::render('Surveys/Edit', [
            'survey' => $survey,
        ]);
    }

    /**
     * Update a survey and resync its questions.
     */
    public function update(StoreSurveyRequest $request, Survey $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        $survey->fill($request->except('questions'))->save();

        // Delete and recreate questions to maintain ordering
        $survey->questions()->delete();

        foreach ($request->input('questions', []) as $index => $questionData) {
            $survey->questions()->create([
                'order' => $index + 1,
                'prompt' => $questionData['prompt'],
                'type' => $questionData['type'],
                'options' => $questionData['options'] ?? null,
                'is_required' => $questionData['is_required'] ?? false,
                'maps_to' => $questionData['maps_to'] ?? null,
            ]);
        }

        return back()->with('success', 'Survey updated.');
    }

    /**
     * Delete a survey.
     */
    public function destroy(Survey $survey): RedirectResponse
    {
        $this->authorize('delete', $survey);

        $survey->delete();

        return redirect()->route('surveys.index')->with('success', 'Survey deleted.');
    }

    /**
     * Show the results of a survey.
     */
    public function results(Survey $survey): Response
    {
        $this->authorize('viewResults', $survey);

        $survey->load(['questions', 'responses.answers']);

        $totalResponses = $survey->responses->where('status', 'submitted')->count();

        $results = $survey->questions->map(function ($question) use ($survey) {
            $answers = $survey->responses->flatMap(
                fn ($r) => $r->answers->where('survey_question_id', $question->id)
            );

            $distribution = null;
            if (in_array($question->type, ['single_choice', 'multi_choice', 'boolean', 'rating'])) {
                $distribution = $answers->countBy(function ($a) {
                    $v = $a->value;

                    return is_array($v) ? implode(', ', $v) : (string) $v;
                })->all();
            }

            return [
                'id' => $question->id,
                'prompt' => $question->prompt,
                'type' => $question->type,
                'order' => $question->order,
                'total_answers' => $answers->count(),
                'answers' => $distribution ? [] : $answers->map(fn ($a) => ['value' => $a->value])->values()->all(),
                'distribution' => $distribution,
            ];
        });

        return Inertia::render('Surveys/Results', [
            'survey' => $survey,
            'results' => $results,
            'totalResponses' => $totalResponses,
        ]);
    }
}

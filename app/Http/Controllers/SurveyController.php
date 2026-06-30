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

        $surveys = $query->withCount('responses')->paginate(20);

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

        $survey->load([
            'questions',
            'responses.answers',
        ]);

        return Inertia::render('Surveys/Results', [
            'survey' => $survey,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSurveyRequest;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Notifications\SurveyInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    /**
     * List surveys — all for managers, open + targeted-at-them for respondents.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Survey::query()->latest();

        if (! $user->hasPermissionTo('surveys.manage')) {
            $query->open()->visibleTo($user);
        }

        $surveys = $query->withCount('responses')->get();

        // Append the user's own response status for respondents. One keyed
        // query for the whole list rather than one per survey.
        if (! $user->hasPermissionTo('surveys.manage')) {
            $responses = SurveyResponse::where('user_id', $user->id)
                ->whereIn('survey_id', $surveys->pluck('id'))
                ->get(['id', 'survey_id', 'status'])
                ->keyBy('survey_id');

            $surveys->each(function (Survey $survey) use ($responses): void {
                $survey->user_response = $responses->get($survey->id)?->only(['id', 'status']);
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

        // safe() (not except()) so raw input cannot overwrite
        // created_by_user_id with somebody else's.
        $survey = Survey::create([
            ...$request->safe()->except('questions'),
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

        if ($survey->status === 'open') {
            Notification::send($survey->eligibleRespondents(), new SurveyInvitation($survey));
        }

        return redirect()->route('surveys.index')->with('success', 'Survey created.');
    }

    /**
     * Show the edit form for a survey.
     */
    public function edit(Survey $survey): Response
    {
        $this->authorize('update', $survey);

        // answers_count tells the editor which questions are already locked.
        $survey->load(['questions' => fn ($query) => $query->withCount('answers')]);

        return Inertia::render('Surveys/Edit', [
            'survey' => $survey,
        ]);
    }

    /**
     * Update a survey and reconcile its questions in place.
     */
    public function update(StoreSurveyRequest $request, Survey $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        $wasOpen = $survey->status === 'open';

        DB::transaction(function () use ($request, $survey): void {
            $survey->fill($request->safe()->except('questions'))->save();

            // No `questions` key at all means "this request isn't about the
            // questions" — leave them alone rather than wiping them.
            if ($request->has('questions')) {
                $this->syncQuestions($survey, $request->input('questions') ?? []);
            }
        });

        // Only invite the first time a survey goes live, not on every edit.
        if (! $wasOpen && $survey->status === 'open') {
            Notification::send($survey->eligibleRespondents(), new SurveyInvitation($survey));
        }

        return back()->with('success', 'Survey updated.');
    }

    /**
     * Reconcile a survey's questions with the submitted list, matching on ID.
     *
     * This used to delete every question and recreate it, and survey_answers
     * cascade on survey_questions — so any edit at all (even fixing a typo in
     * the title) silently destroyed every response already collected. Tracer
     * study data is not recoverable, so the diff below refuses outright to
     * drop or retype a question that has been answered.
     *
     * @param  array<int, array<string, mixed>>  $questions
     */
    private function syncQuestions(Survey $survey, array $questions): void
    {
        $existing = $survey->questions()->withCount('answers')->get()->keyBy('id');
        $keptIds = [];

        foreach (array_values($questions) as $index => $data) {
            $attributes = [
                'order' => $index + 1,
                'prompt' => $data['prompt'],
                'type' => $data['type'],
                'options' => $data['options'] ?? null,
                'is_required' => $data['is_required'] ?? false,
                'maps_to' => $data['maps_to'] ?? null,
            ];

            $question = isset($data['id']) ? $existing->get((int) $data['id']) : null;

            if ($question === null) {
                $survey->questions()->create($attributes);

                continue;
            }

            if ($question->answers_count > 0 && $question->type !== $attributes['type']) {
                throw ValidationException::withMessages([
                    "questions.{$index}.type" => 'This question has already been answered, so its type can no longer be changed.',
                ]);
            }

            $question->fill($attributes)->save();
            $keptIds[] = $question->id;
        }

        $removed = $existing->reject(fn (SurveyQuestion $question) => in_array($question->id, $keptIds, true));

        if ($removed->isEmpty()) {
            return;
        }

        if ($removed->contains(fn (SurveyQuestion $question) => $question->answers_count > 0)) {
            throw ValidationException::withMessages([
                'questions' => 'A question that has already been answered cannot be removed. Close the survey instead.',
            ]);
        }

        // Guarded delete: a response submitted between the count above and
        // this statement would otherwise be destroyed by the cascade. If the
        // delete touches fewer rows than expected, that is exactly what
        // happened, so abandon the whole edit.
        $deleted = SurveyQuestion::whereIn('id', $removed->pluck('id'))
            ->whereDoesntHave('answers')
            ->delete();

        if ($deleted !== $removed->count()) {
            throw ValidationException::withMessages([
                'questions' => 'Someone answered this survey while you were editing it. Reload the page and try again.',
            ]);
        }
    }

    /**
     * Nudge whoever hasn't responded yet (FR7 "distribution... reminders").
     */
    public function remind(Survey $survey): RedirectResponse
    {
        $this->authorize('update', $survey);

        abort_unless($survey->isOpen(), 422, 'Reminders can only be sent while the survey is open.');

        $respondedUserIds = $survey->responses()->where('status', 'submitted')->pluck('user_id');
        $pending = $survey->eligibleRespondents()->reject(fn ($user) => $respondedUserIds->contains($user->id));

        if ($pending->isNotEmpty()) {
            Notification::send($pending, new SurveyInvitation($survey, isReminder: true));
        }

        return back()->with(
            'success',
            $pending->isEmpty() ? 'Everyone eligible has already responded.' : "Reminder sent to {$pending->count()} pending respondent(s).",
        );
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

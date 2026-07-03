<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSkillRequest;
use App\Models\Skill;
use App\Services\SkillSuggestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SkillController extends Controller
{
    public function __construct(private readonly SkillSuggestionService $skills) {}

    /**
     * Autocomplete suggestions for the skills input — library + AI results.
     */
    public function suggest(Request $request): JsonResponse
    {
        $query = (string) $request->query('q', '');

        return response()->json([
            'suggestions' => $this->skills->suggest($query),
        ]);
    }

    /**
     * Validate a free-typed skill, then create and attach it to the
     * authenticated graduate's profile.
     *
     * @throws ValidationException
     */
    public function store(StoreSkillRequest $request): JsonResponse
    {
        $result = $this->skills->validate($request->validated('name'));

        if (! $result['valid']) {
            throw ValidationException::withMessages([
                'name' => $result['reason'] ?? 'That does not look like a recognized skill.',
            ]);
        }

        $skill = Skill::findOrCreateByName($result['canonical']);

        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        $profile->skills()->syncWithoutDetaching([$skill->id => ['source' => 'self']]);

        return response()->json([
            'skill' => $skill->only(['id', 'name', 'category', 'slug']),
        ]);
    }

    /**
     * Validate and persist a skill without attaching it to any profile —
     * used by contexts that manage their own skill pivot (e.g. job postings).
     *
     * @throws ValidationException
     */
    public function resolve(StoreSkillRequest $request): JsonResponse
    {
        $result = $this->skills->validate($request->validated('name'));

        if (! $result['valid']) {
            throw ValidationException::withMessages([
                'name' => $result['reason'] ?? 'That does not look like a recognized skill.',
            ]);
        }

        $skill = Skill::findOrCreateByName($result['canonical']);

        return response()->json([
            'skill' => $skill->only(['id', 'name', 'category', 'slug']),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SkillTaxonomyController extends Controller
{
    /**
     * Skill taxonomy management (AI architecture Layer 2.4 "skill
     * standardization") — merge synonyms like "JS"/"ECMAScript" into one
     * canonical skill so matching and analytics aren't fragmented by
     * spelling variants.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $skills = Skill::with('aliases')
            ->when($request->input('search'), fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/Skills', [
            'skills' => $skills,
            'filters' => $request->only('search'),
        ]);
    }

    public function storeAlias(Request $request, Skill $skill): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $data = $request->validate(['alias' => ['required', 'string', 'max:255']]);
        $slug = Skill::slugFor($data['alias']);

        // A bare abort() is not a ValidationException, so Inertia gets a raw
        // error page instead of a redirect back with an errors bag — the
        // admin console disappeared behind a full-screen 422 over a typo.
        if (Skill::where('slug', $slug)->exists()) {
            throw ValidationException::withMessages([
                'alias' => 'That name is already a skill in its own right.',
            ]);
        }

        SkillAlias::updateOrCreate(
            ['alias_slug' => $slug],
            ['skill_id' => $skill->id, 'alias' => $data['alias']],
        );

        return back()->with('success', 'Alias added.');
    }

    public function destroyAlias(Request $request, SkillAlias $skillAlias): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('learning_resources.manage'), 403);

        $skillAlias->delete();

        return back()->with('success', 'Alias removed.');
    }
}

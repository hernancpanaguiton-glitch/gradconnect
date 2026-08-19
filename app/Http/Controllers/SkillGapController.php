<?php

namespace App\Http\Controllers;

use App\Models\LearningResource;
use App\Services\SkillGapAnalyzer;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SkillGapController extends Controller
{
    public function __construct(private readonly SkillGapAnalyzer $analyzer) {}

    /**
     * Aggregate skill-gap analysis for a graduate/alumnus (manuscript Figure 29,
     * "View Skill Gap Analysis" — actors: Alumni, Graduate Student).
     *
     * Built entirely from JobMatchResult.skill_gaps / matched_skills, which the
     * AI matcher already populates per job match — no separate skill-gap table
     * needed. A skill's rank is how often it shows up as missing (or matched)
     * across the graduate's open-job matches, not a fabricated 0-100 score.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile;

        if (! $profile) {
            return Inertia::render('SkillGap', [
                'hasProfile' => false,
                'hasMatches' => false,
                'gaps' => [],
                'strengths' => [],
                'coverage' => null,
                'totalMatches' => 0,
                'yourSkills' => [],
            ]);
        }

        $analysis = $this->analyzer->analyze($profile);

        return Inertia::render('SkillGap', [
            'hasProfile' => true,
            'hasMatches' => $analysis['totalMatches'] > 0,
            'gaps' => $this->attachRecommendedResources($analysis['gaps']),
            'strengths' => $analysis['strengths'],
            'coverage' => $analysis['coverage'],
            'totalMatches' => $analysis['totalMatches'],
            'yourSkills' => $profile->skillNames(),
        ]);
    }

    /**
     * Skill Bridge Mitigation (Scope §p.6): for each skill flagged as a gap,
     * attach any curated LearningResource that targets it — matched by slug
     * since AI-generated skill_gaps are free text, not Skill IDs.
     */
    private function attachRecommendedResources(Collection $gaps): Collection
    {
        $gapSlugs = $gaps->pluck('skill')->map(fn (string $skill) => Str::slug($skill))->all();

        $resourcesBySlug = [];
        if (! empty($gapSlugs)) {
            $matchingResources = LearningResource::with('skills')
                ->whereHas('skills', fn ($query) => $query->whereIn('slug', $gapSlugs))
                ->get();

            foreach ($matchingResources as $resource) {
                foreach ($resource->skills as $skill) {
                    if (! in_array($skill->slug, $gapSlugs, true)) {
                        continue;
                    }
                    $resourcesBySlug[$skill->slug][] = [
                        'id' => $resource->id,
                        'title' => $resource->title,
                        'type' => $resource->type,
                        'provider' => $resource->provider,
                        'url' => $resource->url,
                    ];
                }
            }
        }

        return $gaps->map(function (array $gap) use ($resourcesBySlug) {
            $gap['resources'] = $resourcesBySlug[Str::slug($gap['skill'])] ?? [];

            return $gap;
        })->values();
    }
}

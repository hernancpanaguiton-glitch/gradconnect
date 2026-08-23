<?php

namespace App\Http\Controllers;

use App\Services\LearningResourceMatcher;
use App\Services\SkillGapAnalyzer;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SkillGapController extends Controller
{
    public function __construct(
        private readonly SkillGapAnalyzer $analyzer,
        private readonly LearningResourceMatcher $resourceMatcher,
    ) {}

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

    private function attachRecommendedResources(Collection $gaps): Collection
    {
        $bySkillName = $this->resourceMatcher->match($gaps->pluck('skill')->all());

        return $gaps->map(function (array $gap) use ($bySkillName) {
            $gap['resources'] = $bySkillName[$gap['skill']] ?? [];

            return $gap;
        })->values();
    }
}

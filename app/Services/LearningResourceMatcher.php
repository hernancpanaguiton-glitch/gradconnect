<?php

namespace App\Services;

use App\Models\LearningResource;
use Illuminate\Support\Str;

/**
 * Skill Bridge Mitigation / AI architecture Layer 4 "learning & development
 * recommendations": map free-text skill names (from AI-generated
 * job_match_results.skill_gaps, matched by slug since they aren't Skill IDs)
 * to any curated LearningResource that targets them. Shared by the
 * aggregate Skill Gap page and individual job match cards, so both read the
 * same mapping instead of drifting apart.
 */
class LearningResourceMatcher
{
    /**
     * @param  array<int, string>  $skillNames
     * @return array<string, array<int, array{id: int, title: string, type: string, provider: ?string, url: ?string}>>
     *              Keyed by the original skill name as given.
     */
    public function match(array $skillNames): array
    {
        $skillNames = array_values(array_unique(array_filter(
            array_map(fn ($name) => trim((string) $name), $skillNames),
        )));

        if (empty($skillNames)) {
            return [];
        }

        $slugToName = [];
        foreach ($skillNames as $name) {
            $slugToName[Str::slug($name)] = $name;
        }

        $resources = LearningResource::with('skills')
            ->whereHas('skills', fn ($query) => $query->whereIn('slug', array_keys($slugToName)))
            ->get();

        $bySkillName = [];
        foreach ($resources as $resource) {
            foreach ($resource->skills as $skill) {
                if (! isset($slugToName[$skill->slug])) {
                    continue;
                }

                $bySkillName[$slugToName[$skill->slug]][] = [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'type' => $resource->type,
                    'provider' => $resource->provider,
                    'url' => $resource->url,
                ];
            }
        }

        return $bySkillName;
    }
}

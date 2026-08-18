<?php

namespace App\Services;

use App\Models\GraduateProfile;
use Illuminate\Support\Collection;

class SkillGapAnalyzer
{
    /**
     * Rank a graduate's missing/matched skills by how often they show up
     * across their AI job matches. Shared by SkillGapController (full page)
     * and DashboardController (dashboard preview) so both read the same
     * numbers rather than drifting apart.
     *
     * @return array{gaps: Collection, strengths: Collection, coverage: int|null, totalMatches: int}
     */
    public function analyze(GraduateProfile $profile, int $limit = 10): array
    {
        $matches = $profile->matchResults()
            ->whereHas('jobPosting', fn ($query) => $query->where('status', 'open'))
            ->get(['skill_gaps', 'matched_skills']);

        $gapCounts = [];
        $matchedCounts = [];

        foreach ($matches as $match) {
            foreach ($match->skill_gaps ?? [] as $skill) {
                $skill = trim((string) $skill);
                if ($skill === '') {
                    continue;
                }
                $gapCounts[$skill] = ($gapCounts[$skill] ?? 0) + 1;
            }

            foreach ($match->matched_skills ?? [] as $skill) {
                $skill = trim((string) $skill);
                if ($skill === '') {
                    continue;
                }
                $matchedCounts[$skill] = ($matchedCounts[$skill] ?? 0) + 1;
            }
        }

        arsort($gapCounts);
        arsort($matchedCounts);

        $totalMatches = $matches->count();

        $toRanked = fn (array $counts) => collect($counts)
            ->take($limit)
            ->map(fn ($count, $skill) => [
                'skill' => $skill,
                'count' => $count,
                'percent' => $totalMatches > 0 ? (int) round($count / $totalMatches * 100) : 0,
            ])
            ->values();

        $uniqueSkillsSeen = collect(array_keys($gapCounts))->merge(array_keys($matchedCounts))->unique()->count();
        $coverage = $uniqueSkillsSeen > 0
            ? (int) round(count($matchedCounts) / $uniqueSkillsSeen * 100)
            : null;

        return [
            'gaps' => $toRanked($gapCounts),
            'strengths' => $toRanked($matchedCounts),
            'coverage' => $coverage,
            'totalMatches' => $totalMatches,
        ];
    }
}

<?php

namespace App\AI\DTO;

class MatchResult
{
    /**
     * @param  array<int, string>  $skillGaps
     * @param  array<int, string>  $matchedSkills
     */
    public function __construct(
        public readonly int $fitScore,
        public readonly string $recommendation,
        public readonly string $explanation,
        public readonly array $skillGaps,
        public readonly array $matchedSkills,
        public readonly string $provider,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, string $provider): self
    {
        return new self(
            fitScore: (int) ($data['fit_score'] ?? 0),
            recommendation: (string) ($data['recommendation'] ?? 'weak'),
            explanation: (string) ($data['explanation'] ?? ''),
            skillGaps: array_values((array) ($data['skill_gaps'] ?? [])),
            matchedSkills: array_values((array) ($data['matched_skills'] ?? [])),
            provider: $provider,
        );
    }
}

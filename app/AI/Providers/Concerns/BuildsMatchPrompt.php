<?php

namespace App\AI\Providers\Concerns;

use App\AI\DTO\MatchResult;

trait BuildsMatchPrompt
{
    /**
     * @param  array<string, mixed>  $context
     */
    protected function buildPrompt(string $resumeText, string $jobText, array $context): string
    {
        $skills = isset($context['required_skills']) ? implode(', ', (array) $context['required_skills']) : 'Not specified';

        return <<<PROMPT
            You are an expert recruiter evaluating how well a candidate's resume fits a job posting.

            Job required skills: {$skills}

            Job posting:
            ---
            {$jobText}
            ---

            Candidate resume:
            ---
            {$resumeText}
            ---

            Respond with ONLY a JSON object (no markdown fences, no commentary) matching this exact shape:
            {
              "fit_score": <integer 0-100>,
              "recommendation": "strong" | "moderate" | "weak",
              "explanation": "<2-3 sentence explanation>",
              "skill_gaps": ["<skill the candidate is missing>", ...],
              "matched_skills": ["<skill the candidate has that matches>", ...]
            }
            PROMPT;
    }

    /**
     * Defensively parse a JSON match result from a raw LLM text response.
     */
    protected function parseJsonResponse(?string $raw, string $provider): ?MatchResult
    {
        if (! $raw) {
            return null;
        }

        $cleaned = trim($raw);
        $cleaned = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $cleaned) ?? $cleaned;

        $data = json_decode($cleaned, true);

        if (! is_array($data) || ! isset($data['fit_score'])) {
            return null;
        }

        return MatchResult::fromArray($data, $provider);
    }
}

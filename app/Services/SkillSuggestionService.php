<?php

namespace App\Services;

use App\Models\Skill;
use Illuminate\Support\Str;

class SkillSuggestionService
{
    public function __construct(private readonly AiChatClient $ai) {}

    /**
     * Suggest skills for an autocomplete query: existing library skills first
     * (fast, offline), then AI-suggested legitimate skills not already listed.
     *
     * @return array<int, array{id: int|null, name: string, source: string}>
     */
    public function suggest(string $query): array
    {
        $query = trim($query);

        if ($query === '') {
            return [];
        }

        $library = Skill::query()
            ->where('name', 'like', '%'.$query.'%')
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name'])
            ->map(fn (Skill $skill): array => ['id' => $skill->id, 'name' => $skill->name, 'source' => 'library'])
            ->all();

        $seen = collect($library)->map(fn (array $item): string => Str::lower($item['name']))->all();

        $suggestions = $library;

        foreach ($this->aiSuggest($query) as $name) {
            if (in_array(Str::lower($name), $seen, true)) {
                continue;
            }

            $seen[] = Str::lower($name);
            $suggestions[] = ['id' => null, 'name' => $name, 'source' => 'ai'];
        }

        return array_slice($suggestions, 0, 12);
    }

    /**
     * Validate that a free-typed name is a legitimate skill. Without an AI
     * provider configured, accept the input as-is (graceful degradation).
     *
     * @return array{valid: bool, canonical: string|null, reason: string|null}
     */
    public function validate(string $name): array
    {
        $name = trim($name);

        if ($name === '') {
            return ['valid' => false, 'canonical' => null, 'reason' => 'Please enter a skill.'];
        }

        if (! $this->ai->hasProvider()) {
            return ['valid' => true, 'canonical' => Str::title($name), 'reason' => null];
        }

        $response = $this->ai->json(
            'Decide whether the input is a legitimate professional, technical, or soft skill '.
            'someone would list on a résumé (e.g. "Kubernetes", "Project Management"). '.
            'Respond ONLY as JSON: {"valid": true|false, "canonical": "Proper Case Skill Name"}. '.
            'Input: "'.$name.'"'
        );

        if ($response === null || ! array_key_exists('valid', $response)) {
            // Provider hiccup — don't block the user on infrastructure.
            return ['valid' => true, 'canonical' => Str::title($name), 'reason' => null];
        }

        $valid = (bool) $response['valid'];

        return [
            'valid' => $valid,
            'canonical' => $valid ? (($response['canonical'] ?? null) ?: Str::title($name)) : null,
            'reason' => $valid ? null : "\"{$name}\" doesn't look like a recognized skill.",
        ];
    }

    /**
     * @return array<int, string>
     */
    private function aiSuggest(string $query): array
    {
        if (! $this->ai->hasProvider()) {
            return [];
        }

        $response = $this->ai->json(
            'You are a skills taxonomy assistant. List up to 8 real, well-known professional or '.
            'technical skills that match or closely relate to the query. Only legitimate skills, '.
            'no sentences. Respond ONLY as JSON: {"skills": ["Skill One", "Skill Two"]}. '.
            'Query: "'.$query.'"'
        );

        $skills = $response['skills'] ?? [];

        return collect(is_array($skills) ? $skills : [])
            ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
            ->map(fn (string $name): string => trim($name))
            ->take(8)
            ->values()
            ->all();
    }
}

<?php

namespace App\Services;

class JobContentService
{
    public function __construct(private readonly AiChatClient $ai) {}

    /**
     * Suggest real, well-known job titles matching an autocomplete query.
     *
     * @return array<int, string>
     */
    public function suggestTitles(string $query): array
    {
        $query = trim($query);

        if ($query === '' || ! $this->ai->hasProvider()) {
            return [];
        }

        $response = $this->ai->json(
            'You are a recruitment assistant. List up to 8 real, common job titles that match or '.
            'closely relate to the query. Titles only, no descriptions. '.
            'Respond ONLY as JSON: {"titles": ["Title One", "Title Two"]}. '.
            'Query: "'.$query.'"'
        );

        $titles = $response['titles'] ?? [];

        return collect(is_array($titles) ? $titles : [])
            ->filter(fn ($title): bool => is_string($title) && trim($title) !== '')
            ->map(fn (string $title): string => trim($title))
            ->unique()
            ->take(8)
            ->values()
            ->all();
    }

    /**
     * Draft a job description for a title. Returns null when no AI provider
     * is configured so the caller can surface a friendly message.
     */
    public function generateDescription(string $title, ?string $company = null): ?string
    {
        if (trim($title) === '' || ! $this->ai->hasProvider()) {
            return null;
        }

        return $this->ai->text(
            'Write a concise, professional job description (2–4 short paragraphs, no headings, '.
            'no markdown) for the role below. Focus on the role summary and day-to-day '.
            'responsibilities. Do not invent a company name or salary.'.
            ($company ? ' Company: "'.$company.'".' : '').
            ' Job title: "'.trim($title).'".'
        );
    }

    /**
     * Draft a qualifications list for a title (and optional description).
     */
    public function generateQualifications(string $title, ?string $description = null): ?string
    {
        if (trim($title) === '' || ! $this->ai->hasProvider()) {
            return null;
        }

        return $this->ai->text(
            'List 5–8 realistic qualifications and requirements for the role below, one per line, '.
            'each starting with "- " (no headings, no markdown bold). Include education, experience, '.
            'and key skills.'.
            ($description ? ' Job description for context: "'.mb_substr($description, 0, 1500).'".' : '').
            ' Job title: "'.trim($title).'".'
        );
    }
}

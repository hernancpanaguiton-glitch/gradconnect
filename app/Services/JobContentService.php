<?php

namespace App\Services;

use App\Support\UclmCatalog;

class JobContentService
{
    private const TITLE_LIMIT = 8;

    public function __construct(private readonly AiChatClient $ai) {}

    /**
     * Suggest real, well-known job titles matching an autocomplete query.
     *
     * AI suggestions lead, then the UCLM catalogue fills the tail — which is
     * also what keeps the field useful on an installation with no AI key.
     *
     * @return array<int, string>
     */
    public function suggestTitles(string $query): array
    {
        $query = trim($query);

        if ($query === '') {
            return [];
        }

        return collect($this->aiTitles($query))
            ->merge(UclmCatalog::suggestJobTitles($query, self::TITLE_LIMIT))
            ->filter(fn ($title): bool => is_string($title) && trim($title) !== '')
            ->map(fn (string $title): string => trim($title))
            ->unique(fn (string $title): string => mb_strtolower($title))
            ->take(self::TITLE_LIMIT)
            ->values()
            ->all();
    }

    /**
     * @return array<int, mixed>
     */
    private function aiTitles(string $query): array
    {
        if (! $this->ai->hasProvider()) {
            return [];
        }

        $response = $this->ai->json(
            'You are a recruitment assistant. List up to 8 real, common job titles that match or '.
            'closely relate to the query. Titles only, no descriptions. '.
            'Respond ONLY as JSON: {"titles": ["Title One", "Title Two"]}. '.
            'Query: "'.$query.'"'
        );

        $titles = $response['titles'] ?? [];

        return is_array($titles) ? array_values($titles) : [];
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

<?php

namespace App\Services;

use App\Models\GraduateProfile;
use App\Models\Resume;
use Illuminate\Support\Str;

class ResumeAnalysisService
{
    public function __construct(private readonly AiChatClient $ai) {}

    /**
     * Analyze a graduate's primary résumé against their profile.
     *
     * @return array<string, mixed>
     */
    public function analyze(GraduateProfile $profile): array
    {
        $profile->loadMissing(['skills', 'educationRecords', 'employmentRecords', 'primaryResume']);
        $resume = $profile->primaryResume;

        if (! $resume) {
            return ['hasResume' => false];
        }

        $discrepancies = $this->findDiscrepancies($profile, $resume);
        $analysis = $this->aiAnalysis($profile, $resume) ?? $this->heuristicAnalysis($profile, $resume);

        return array_merge($analysis, [
            'hasResume' => true,
            'resumeName' => $resume->original_filename,
            'resumeStatus' => $resume->embedding_status,
            'discrepancies' => $discrepancies,
        ]);
    }

    /**
     * Deterministic profile ↔ résumé consistency checks. Always runs, no AI.
     *
     * @return array<int, array{severity: string, title: string, detail: string}>
     */
    private function findDiscrepancies(GraduateProfile $profile, Resume $resume): array
    {
        $text = Str::lower($resume->extracted_text ?? '');
        $mentions = fn (?string $needle): bool => $needle !== null && $needle !== '' && str_contains($text, Str::lower($needle));

        $discrepancies = [];

        if (trim($text) === '') {
            $discrepancies[] = [
                'severity' => 'info',
                'title' => 'Résumé text not extracted yet',
                'detail' => 'The résumé is still being processed, or no text could be read from the file. Consistency checks will run once it is ready.',
            ];

            return $discrepancies;
        }

        // Skills listed on the profile but not found in the résumé.
        $missingSkills = collect($profile->skillNames())
            ->reject(fn (string $skill): bool => $mentions($skill))
            ->values();
        if ($missingSkills->isNotEmpty()) {
            $discrepancies[] = [
                'severity' => 'warning',
                'title' => 'Profile skills missing from résumé',
                'detail' => 'These skills are on your profile but not mentioned in your résumé: '.$missingSkills->implode(', ').'.',
            ];
        }

        // Employment history on the profile but not reflected in the résumé.
        $missingEmployers = $profile->employmentRecords
            ->pluck('company_name')->filter()
            ->reject(fn (string $company): bool => $mentions($company))->values();
        if ($missingEmployers->isNotEmpty()) {
            $discrepancies[] = [
                'severity' => 'warning',
                'title' => 'Employment not on résumé',
                'detail' => 'Your profile lists work at '.$missingEmployers->implode(', ').', but these employers are not mentioned in your résumé.',
            ];
        }

        // Education on the profile but not reflected in the résumé.
        $missingSchools = $profile->educationRecords
            ->pluck('institution')->filter()
            ->reject(fn (string $school): bool => $mentions($school))->values();
        if ($missingSchools->isNotEmpty()) {
            $discrepancies[] = [
                'severity' => 'info',
                'title' => 'Education not on résumé',
                'detail' => 'Your profile lists '.$missingSchools->implode(', ').', not found in your résumé.',
            ];
        }

        // "Employed" status but no current employment record.
        $hasCurrent = $profile->employmentRecords->firstWhere('is_current', true) !== null;
        if ($profile->current_employment_status === 'employed' && ! $hasCurrent) {
            $discrepancies[] = [
                'severity' => 'warning',
                'title' => 'Employment status mismatch',
                'detail' => 'Your status is "Employed" but you have no current employment record on your profile.',
            ];
        }

        return $discrepancies;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function aiAnalysis(GraduateProfile $profile, Resume $resume): ?array
    {
        if (! $this->ai->hasProvider() || trim((string) $resume->extracted_text) === '') {
            return null;
        }

        $response = $this->ai->json(
            'You are a career coach reviewing a graduate résumé. Score it 0-100 for overall quality and '.
            'job-readiness, then give concrete feedback. Respond ONLY as JSON: '.
            '{"score": number, "strengths": [string], "suggestions": [string], '.
            '"matched_keywords": [string], "missing_keywords": [string]}. '.
            'Profile:\n'.mb_substr($profile->buildProfileText(), 0, 1500)."\n\n".
            'Résumé:\n'.mb_substr((string) $resume->extracted_text, 0, 4000)
        );

        if ($response === null || ! isset($response['score'])) {
            return null;
        }

        return [
            'score' => max(0, min(100, (int) $response['score'])),
            'strengths' => $this->stringList($response['strengths'] ?? []),
            'suggestions' => $this->stringList($response['suggestions'] ?? []),
            'keywords' => $this->keywords(
                $this->stringList($response['matched_keywords'] ?? []),
                $this->stringList($response['missing_keywords'] ?? []),
            ),
            'poweredByAi' => true,
        ];
    }

    /**
     * Fallback analysis without AI: score from profile completeness + skill
     * coverage; keywords from profile skills present in the résumé.
     *
     * @return array<string, mixed>
     */
    private function heuristicAnalysis(GraduateProfile $profile, Resume $resume): array
    {
        $text = Str::lower($resume->extracted_text ?? '');
        $skills = $profile->skillNames();
        $matched = collect($skills)->filter(fn (string $s): bool => str_contains($text, Str::lower($s)))->values();
        $missing = collect($skills)->reject(fn (string $s): bool => str_contains($text, Str::lower($s)))->values();

        $coverage = count($skills) > 0 ? (int) round($matched->count() / count($skills) * 100) : 60;
        $score = (int) round($profile->profile_completion * 0.5 + $coverage * 0.3 + (trim($text) !== '' ? 20 : 0));

        $strengths = array_values(array_filter([
            $profile->summary ? 'Includes a professional summary.' : null,
            $profile->educationRecords->isNotEmpty() ? 'Education history is documented.' : null,
            $profile->employmentRecords->isNotEmpty() ? 'Work experience is listed.' : null,
            $matched->isNotEmpty() ? 'Résumé reflects key skills: '.$matched->take(5)->implode(', ').'.' : null,
        ])) ?: ['Résumé uploaded and ready for review.'];

        $suggestions = array_values(array_filter([
            ! $profile->summary ? 'Add a concise professional summary at the top.' : null,
            $missing->isNotEmpty() ? 'Mention these profile skills in your résumé: '.$missing->take(5)->implode(', ').'.' : null,
            $profile->employmentRecords->isEmpty() ? 'Add your work or internship experience.' : null,
            'Quantify achievements with measurable impact (e.g. "cut load time 40%").',
        ])) ?: ['Keep your résumé updated as you gain experience.'];

        return [
            'score' => max(0, min(100, $score)),
            'strengths' => $strengths,
            'suggestions' => $suggestions,
            'keywords' => $this->keywords($matched->all(), $missing->all()),
            'poweredByAi' => false,
        ];
    }

    /**
     * @param  array<int, string>  $matched
     * @param  array<int, string>  $missing
     * @return array<int, array{label: string, match: bool}>
     */
    private function keywords(array $matched, array $missing): array
    {
        return collect($matched)->map(fn (string $k): array => ['label' => $k, 'match' => true])
            ->merge(collect($missing)->map(fn (string $k): array => ['label' => $k, 'match' => false]))
            ->take(16)
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function stringList(mixed $value): array
    {
        return collect(is_array($value) ? $value : [])
            ->filter(fn ($item): bool => is_string($item) && trim($item) !== '')
            ->map(fn (string $item): string => trim($item))
            ->take(8)
            ->values()
            ->all();
    }
}

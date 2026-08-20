<?php

namespace App\Services;

use App\Models\EmployerFeedback;
use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\JobMatchResult;
use App\Models\Survey;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Central home for the report numbers shown on the Employability Report and
 * Program Outcomes pages, and behind their CSV exports — so all three read
 * the same computation instead of drifting apart (completion plan Phase 3).
 */
class ReportService
{
    /**
     * Employability metrics (FR9 Reports and Analytics), optionally
     * filtered by department (college or program) and/or graduation year.
     * Empty filters = every graduate.
     *
     * @param  array{department_ids?: array<int, int>, graduation_year?: int|null}  $filters
     * @return array<string, mixed>
     */
    public function employabilitySummary(array $filters = []): array
    {
        $departmentIds = $filters['department_ids'] ?? [];
        $graduationYear = $filters['graduation_year'] ?? null;

        $profiles = $this->scopedProfiles($departmentIds, $graduationYear);

        $totalGraduates = (clone $profiles)->count();

        $employmentBreakdown = (clone $profiles)
            ->selectRaw('current_employment_status, count(*) as total')
            ->whereNotNull('current_employment_status')
            ->groupBy('current_employment_status')
            ->pluck('total', 'current_employment_status')
            ->toArray();

        $willingToRelocate = (clone $profiles)->where('willing_to_relocate', true)->count();

        $profileIds = (clone $profiles)->pluck('id');

        $currentEmployment = EmploymentRecord::whereIn('graduate_profile_id', $profileIds)->where('is_current', true);
        $currentCount = (clone $currentEmployment)->count();
        $relatedCount = (clone $currentEmployment)->where('is_related_to_course', true)->count();

        $salaryDistribution = (clone $currentEmployment)
            ->whereNotNull('monthly_salary_range')
            ->selectRaw('monthly_salary_range, count(*) as total')
            ->groupBy('monthly_salary_range')
            ->pluck('total', 'monthly_salary_range')
            ->toArray();

        return [
            'totalGraduates' => $totalGraduates,
            'employmentBreakdown' => $employmentBreakdown,
            'willingToRelocate' => $willingToRelocate,
            'jobRelevanceRate' => $currentCount > 0 ? (int) round($relatedCount / $currentCount * 100) : null,
            'salaryDistribution' => $salaryDistribution,
            'avgTimeToEmploymentMonths' => $this->averageTimeToEmploymentMonths($profileIds),
            'surveyResponseRates' => $this->surveyResponseRates($departmentIds, $graduationYear),
        ];
    }

    /**
     * Skill analytics for curriculum evaluation (FR14; FDD Department Head
     * "identify curriculum improvement opportunities" / "assess program
     * effectiveness" / "support accreditation requirements"): the skills
     * most often flagged as missing in AI job matches, and average
     * employer-rated competencies, for graduates in scope.
     *
     * @param  array{department_ids?: array<int, int>, graduation_year?: int|null}  $filters
     * @return array<string, mixed>
     */
    public function skillAnalytics(array $filters = [], int $limit = 10): array
    {
        $profileIds = $this->scopedProfiles($filters['department_ids'] ?? [], $filters['graduation_year'] ?? null)->pluck('id');

        return [
            'topSkillGaps' => $this->topSkillGaps($profileIds, $limit),
            'competencyAverages' => $this->averageCompetencyRatings($profileIds),
            'feedbackCount' => EmployerFeedback::whereIn('graduate_profile_id', $profileIds)->count(),
        ];
    }

    /**
     * @param  array<int, int>  $departmentIds
     */
    private function scopedProfiles(array $departmentIds, ?int $graduationYear): Builder
    {
        return GraduateProfile::query()
            ->when(! empty($departmentIds), fn ($query) => $query->whereIn('department_id', $departmentIds))
            ->when($graduationYear !== null, fn ($query) => $query->where('graduation_year', $graduationYear));
    }

    /**
     * Average months between January 1 of a graduate's graduation year and
     * the start date of their earliest employment record. Only computable
     * where both exist, so this silently excludes anyone missing either —
     * there's no "date of graduation" field, only a graduation year.
     *
     * @param  Collection<int, int>  $profileIds
     */
    private function averageTimeToEmploymentMonths(Collection $profileIds): ?int
    {
        $profiles = GraduateProfile::whereIn('id', $profileIds)
            ->whereNotNull('graduation_year')
            ->with(['employmentRecords' => fn ($query) => $query->whereNotNull('start_date')->orderBy('start_date')])
            ->get();

        $months = [];
        foreach ($profiles as $profile) {
            $firstJob = $profile->employmentRecords->first();
            if ($firstJob === null) {
                continue;
            }

            $graduated = Carbon::create($profile->graduation_year, 1, 1);
            $diff = (int) $graduated->diffInMonths($firstJob->start_date, false);
            if ($diff >= 0) {
                $months[] = $diff;
            }
        }

        return count($months) > 0 ? (int) round(array_sum($months) / count($months)) : null;
    }

    /**
     * Response rate for each of the 10 most recent tracer/employability
     * surveys, scoped to respondents in the given departments/graduation year.
     *
     * @param  array<int, int>  $departmentIds
     * @return array<int, array{title: string, submitted: int, eligible: int, responseRate: int}>
     */
    private function surveyResponseRates(array $departmentIds, ?int $graduationYear): array
    {
        return Survey::whereIn('type', ['employability', 'tracer'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Survey $survey) use ($departmentIds, $graduationYear) {
                $eligible = $survey->eligibleRespondents();

                if (! empty($departmentIds)) {
                    $eligible = $eligible->filter(
                        fn ($user) => in_array($user->graduateProfile?->department_id, $departmentIds, true)
                    );
                }

                if ($graduationYear !== null) {
                    $eligible = $eligible->filter(function ($user) use ($graduationYear) {
                        $profile = $user->graduateProfile;
                        $year = $profile?->graduation_year ?? $profile?->expected_graduation_year;

                        return $year === $graduationYear;
                    });
                }

                $eligibleIds = $eligible->pluck('id');
                $submitted = $eligibleIds->isEmpty() ? 0 : $survey->responses()
                    ->where('status', 'submitted')
                    ->whereIn('user_id', $eligibleIds)
                    ->count();

                return [
                    'title' => $survey->title,
                    'submitted' => $submitted,
                    'eligible' => $eligibleIds->count(),
                    'responseRate' => $eligibleIds->count() > 0 ? (int) round($submitted / $eligibleIds->count() * 100) : 0,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, int>  $profileIds
     * @return array<int, array{skill: string, count: int}>
     */
    private function topSkillGaps(Collection $profileIds, int $limit): array
    {
        $matches = JobMatchResult::whereIn('graduate_profile_id', $profileIds)->get(['skill_gaps']);

        $counts = [];
        foreach ($matches as $match) {
            foreach ($match->skill_gaps ?? [] as $skill) {
                $skill = trim((string) $skill);
                if ($skill === '') {
                    continue;
                }
                $counts[$skill] = ($counts[$skill] ?? 0) + 1;
            }
        }
        arsort($counts);

        return collect($counts)->take($limit)
            ->map(fn ($count, $skill) => ['skill' => $skill, 'count' => $count])
            ->values()
            ->all();
    }

    /**
     * Average of each named competency (1-5) across all employer feedback
     * for graduates in scope.
     *
     * @param  Collection<int, int>  $profileIds
     * @return array<string, float>
     */
    private function averageCompetencyRatings(Collection $profileIds): array
    {
        $feedback = EmployerFeedback::whereIn('graduate_profile_id', $profileIds)
            ->whereNotNull('competency_ratings')
            ->pluck('competency_ratings');

        $sums = [];
        $counts = [];
        foreach ($feedback as $ratings) {
            foreach ($ratings ?? [] as $key => $value) {
                if (! is_numeric($value)) {
                    continue;
                }
                $sums[$key] = ($sums[$key] ?? 0) + $value;
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }

        $averages = [];
        foreach ($sums as $key => $sum) {
            $averages[$key] = round($sum / $counts[$key], 1);
        }

        return $averages;
    }
}

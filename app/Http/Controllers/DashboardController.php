<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobMatchResult;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\SkillGapAnalyzer;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function __construct(private readonly SkillGapAnalyzer $skillGapAnalyzer) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        [$component, $stats] = match (true) {
            $user->hasRole('admin') => ['Dashboards/AdminDashboard', $this->adminStats()],
            $user->hasRole('alumni_affairs') => ['Dashboards/AlumniAffairsDashboard', $this->alumniAffairsStats()],
            $user->hasRole('department_head') => ['Dashboards/DepartmentHeadDashboard', $this->departmentHeadStats($user)],
            $user->hasRole('industry_partner') => ['Dashboards/IndustryPartnerDashboard', $this->industryPartnerStats($user)],
            $user->hasRole('sao') => ['Dashboards/SaoDashboard', $this->saoStats()],
            $user->hasRole('student') => ['Dashboards/StudentDashboard', $this->graduateStats($user, isStudent: true)],
            default => ['Dashboards/AlumniDashboard', $this->graduateStats($user, isStudent: false)],
        };

        $props = ['stats' => $stats];

        // Each role gets its own chart series, computed from real data rather
        // than a shared placeholder dataset (see completion plan Phase 1).
        if ($user->hasRole('admin')) {
            $props['industryDistribution'] = $this->industryDistribution();
        } elseif ($user->hasRole('alumni_affairs')) {
            $props['industryDistribution'] = $this->industryDistribution();
            $props['employmentTrend'] = $this->monthlyEmploymentPlacements();
        } elseif ($user->hasRole('department_head')) {
            $props['colleges'] = Department::colleges()->orderBy('name')->get(['id', 'name', 'code']);
            $props['placementByProgram'] = $this->placementByProgram($user->scopedDepartmentIds());
        } elseif ($user->hasRole('industry_partner')) {
            $postingIds = $user->company?->jobPostings()->pluck('id') ?? collect();
            $props['hiringFunnel'] = $this->hiringFunnel($postingIds);
        } elseif ($user->hasRole('sao')) {
            $props['profileCompletionByProgram'] = $this->profileCompletionByProgram();
        } elseif ($user->hasRole('student')) {
            $props['skillPreview'] = $this->skillPreview($user->graduateProfile);
        } else {
            // Alumni.
            $props['applicationActivity'] = $this->applicationActivityByMonth($user);
            $props['recentApplications'] = $this->recentApplications($user);
            $props['profileChecklist'] = $this->profileChecklist($user->graduateProfile);
        }

        return Inertia::render($component, $props);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function adminStats(): array
    {
        return [
            ['label' => 'Total Users', 'value' => User::count()],
            ['label' => 'Pending Approvals', 'value' => User::where('status', 'pending')->count(), 'sub' => 'Awaiting activation'],
            ['label' => 'Active Job Postings', 'value' => JobPosting::where('status', 'open')->count()],
            ['label' => 'Roles', 'value' => Role::count(), 'sub' => 'Configured roles'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function alumniAffairsStats(): array
    {
        $totalProfiles = GraduateProfile::count();
        $employed = GraduateProfile::where('current_employment_status', 'employed')->count();

        return [
            ['label' => 'Total Alumni', 'value' => User::role('alumni')->count()],
            ['label' => 'Active Surveys', 'value' => Survey::where('status', 'open')->count()],
            ['label' => 'Survey Responses', 'value' => SurveyResponse::where('status', 'submitted')->count(), 'sub' => 'Submitted'],
            ['label' => 'Employment Rate', 'value' => $this->percent($employed, $totalProfiles), 'sub' => 'Of graduates with profiles'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departmentHeadStats(User $user): array
    {
        $departmentIds = $user->scopedDepartmentIds();

        $profileIds = GraduateProfile::whereIn('department_id', $departmentIds)->pluck('id');
        $total = $profileIds->count();
        $employed = GraduateProfile::whereIn('id', $profileIds)
            ->where('current_employment_status', 'employed')
            ->count();

        $currentEmployment = EmploymentRecord::whereIn('graduate_profile_id', $profileIds)->where('is_current', true);
        $currentCount = (clone $currentEmployment)->count();
        $relatedCount = (clone $currentEmployment)->where('is_related_to_course', true)->count();

        return [
            ['label' => 'Graduates', 'value' => $total, 'sub' => 'In your department'],
            ['label' => 'Employment Rate', 'value' => $this->percent($employed, $total), 'sub' => 'Based on profiles'],
            ['label' => 'Related Employment', 'value' => $this->percent($relatedCount, $currentCount), 'sub' => 'Jobs related to degree'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function industryPartnerStats(User $user): array
    {
        $company = $user->company;

        if ($company === null) {
            return [
                ['label' => 'Active Postings', 'value' => 0],
                ['label' => 'Total Applications', 'value' => 0],
                ['label' => 'Shortlisted', 'value' => 0],
                ['label' => 'AI Matches', 'value' => 0, 'sub' => 'Scored candidates'],
            ];
        }

        $postingIds = $company->jobPostings()->pluck('id');

        return [
            ['label' => 'Active Postings', 'value' => $company->jobPostings()->where('status', 'open')->count()],
            ['label' => 'Total Applications', 'value' => JobApplication::whereIn('job_posting_id', $postingIds)->count()],
            ['label' => 'Shortlisted', 'value' => JobApplication::whereIn('job_posting_id', $postingIds)->where('status', 'shortlisted')->count()],
            ['label' => 'AI Matches', 'value' => JobMatchResult::whereIn('job_posting_id', $postingIds)->count(), 'sub' => 'Scored candidates'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function saoStats(): array
    {
        $studentUserIds = User::role('student')->pluck('id');
        $studentProfiles = GraduateProfile::whereIn('user_id', $studentUserIds);

        $avgCompletion = (clone $studentProfiles)->avg('profile_completion');
        $withResume = (clone $studentProfiles)->whereHas('resumes')->count();
        $aiMatches = JobMatchResult::whereHas(
            'graduateProfile',
            fn ($query) => $query->whereIn('user_id', $studentUserIds)
        )->count();

        return [
            ['label' => 'Total Students', 'value' => $studentUserIds->count()],
            ['label' => 'Avg. Profile Completion', 'value' => round($avgCompletion ?? 0).'%', 'sub' => 'Across all students'],
            ['label' => 'Students With Résumés', 'value' => $withResume, 'sub' => 'Career-ready for AI matching'],
            ['label' => 'AI Job Matches Generated', 'value' => $aiMatches, 'sub' => 'For your students'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function graduateStats(User $user, bool $isStudent): array
    {
        $profile = $user->graduateProfile;
        $completion = $profile?->profile_completion ?? 0;

        if ($isStudent) {
            return [
                ['label' => 'Profile Completion', 'value' => "{$completion}%", 'sub' => 'Keep it up to date'],
                ['label' => 'Skills Listed', 'value' => $profile?->skills()->count() ?? 0],
                ['label' => 'Open Positions', 'value' => JobPosting::where('status', 'open')->count(), 'sub' => 'Internships & jobs'],
            ];
        }

        $recommendations = $profile
            ? JobMatchResult::where('graduate_profile_id', $profile->id)
                ->whereHas('jobPosting', fn ($query) => $query->where('status', 'open'))
                ->count()
            : 0;

        $applications = $profile
            ? JobApplication::where('graduate_profile_id', $profile->id)->where('status', '!=', 'withdrawn')->count()
            : 0;

        // Same scope the surveys index uses, so the badge counts what the
        // graduate can actually open — it used to count every open survey,
        // including ones targeted at another role or graduation year.
        $pendingSurveys = Survey::open()
            ->visibleTo($user)
            ->whereDoesntHave('responses', fn ($query) => $query
                ->where('user_id', $user->id)
                ->where('status', 'submitted'))
            ->count();

        return [
            ['label' => 'Profile Completion', 'value' => "{$completion}%", 'sub' => 'Complete your profile'],
            ['label' => 'Job Recommendations', 'value' => $recommendations, 'sub' => 'Based on your profile'],
            ['label' => 'Applications', 'value' => $applications, 'sub' => 'Active applications'],
            ['label' => 'Pending Surveys', 'value' => $pendingSurveys, 'sub' => 'Waiting for response'],
        ];
    }

    /**
     * Current-employment industry breakdown, top 5 + an "Others" bucket.
     *
     * @param  Collection<int, int>|null  $graduateProfileIds  Scope to these profiles, or null for everyone.
     * @return array<int, array{name: string, value: int, color: string}>
     */
    private function industryDistribution(?Collection $graduateProfileIds = null): array
    {
        $palette = ['#1a56db', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

        $query = EmploymentRecord::query()->where('is_current', true)->whereNotNull('industry');
        if ($graduateProfileIds !== null) {
            $query->whereIn('graduate_profile_id', $graduateProfileIds);
        }

        $counts = $query->selectRaw('industry, count(*) as total')
            ->groupBy('industry')
            ->pluck('total', 'industry')
            ->sortDesc();

        $result = [];
        $i = 0;
        foreach ($counts->take(5) as $industry => $total) {
            $result[] = ['name' => $industry, 'value' => $total, 'color' => $palette[$i] ?? '#64748b'];
            $i++;
        }

        $others = (int) $counts->slice(5)->sum();
        if ($others > 0) {
            $result[] = ['name' => 'Others', 'value' => $others, 'color' => $palette[5]];
        }

        return $result;
    }

    /**
     * New employment-record start dates per month, last 6 months — a real,
     * countable "employment trend" (unlike a fabricated cumulative % line).
     *
     * @param  Collection<int, int>|null  $graduateProfileIds
     * @return array<int, array{month: string, placements: int}>
     */
    private function monthlyEmploymentPlacements(?Collection $graduateProfileIds = null): array
    {
        $since = now()->subMonths(5)->startOfMonth();

        $query = EmploymentRecord::query()->whereNotNull('start_date')->where('start_date', '>=', $since);
        if ($graduateProfileIds !== null) {
            $query->whereIn('graduate_profile_id', $graduateProfileIds);
        }

        $byMonth = $query->get(['start_date'])->groupBy(fn (EmploymentRecord $r) => $r->start_date->format('Y-m'));

        return $this->lastSixMonths(fn (string $key, string $label) => [
            'month' => $label,
            'placements' => $byMonth->get($key)?->count() ?? 0,
        ]);
    }

    /**
     * Placement rate for each program (child department) in scope. Falls
     * back to the scoped departments themselves if none are typed 'program'
     * (e.g. a head assigned directly to a single program).
     *
     * @param  array<int, int>  $departmentIds
     * @return array<int, array{dept: string, rate: int}>
     */
    private function placementByProgram(array $departmentIds): array
    {
        $programs = Department::whereIn('id', $departmentIds)->where('type', 'program')->get(['id', 'name']);
        if ($programs->isEmpty()) {
            $programs = Department::whereIn('id', $departmentIds)->get(['id', 'name']);
        }

        return $programs->map(function (Department $dept) {
            $profileIds = GraduateProfile::where('department_id', $dept->id)->pluck('id');
            $total = $profileIds->count();
            $employed = GraduateProfile::whereIn('id', $profileIds)->where('current_employment_status', 'employed')->count();

            return [
                'dept' => $dept->name,
                'rate' => $total > 0 ? (int) round($employed / $total * 100) : 0,
            ];
        })->values()->all();
    }

    /**
     * Average profile completion among students, grouped by program — a real
     * proxy for career readiness until the Career Readiness Assessment
     * (completion plan Phase 2d) exists.
     *
     * @return array<int, array{dept: string, rate: int}>
     */
    private function profileCompletionByProgram(): array
    {
        $studentUserIds = User::role('student')->pluck('id');

        return GraduateProfile::whereIn('user_id', $studentUserIds)
            ->whereNotNull('department_id')
            ->with('department')
            ->get()
            ->groupBy(fn (GraduateProfile $p) => $p->department?->name ?? 'Unassigned')
            ->map(fn (Collection $group, string $name) => [
                'dept' => $name,
                'rate' => (int) round($group->avg('profile_completion')),
            ])
            ->values()
            ->all();
    }

    /**
     * Applications received (any status), shortlisted, and hired per month
     * for one partner's own postings, last 6 months.
     *
     * @param  Collection<int, int>  $postingIds
     * @return array<int, array{month: string, applied: int, shortlisted: int, hired: int}>
     */
    private function hiringFunnel(Collection $postingIds): array
    {
        $since = now()->subMonths(5)->startOfMonth();

        $applications = $postingIds->isEmpty()
            ? collect()
            : JobApplication::whereIn('job_posting_id', $postingIds)
                ->where('applied_at', '>=', $since)
                ->get(['applied_at', 'status']);

        $byMonth = $applications->groupBy(fn (JobApplication $a) => $a->applied_at?->format('Y-m'));

        return $this->lastSixMonths(function (string $key, string $label) use ($byMonth) {
            $inMonth = $byMonth->get($key) ?? collect();

            return [
                'month' => $label,
                'applied' => $inMonth->count(),
                'shortlisted' => $inMonth->where('status', 'shortlisted')->count(),
                'hired' => $inMonth->where('status', 'hired')->count(),
            ];
        });
    }

    /**
     * Top skill gaps/strengths for the dashboard preview card (full ranking
     * lives on the /skill-gap page — see SkillGapController).
     *
     * @return array{gaps: Collection, strengths: Collection, hasMatches: bool}
     */
    private function skillPreview(?GraduateProfile $profile): array
    {
        if (! $profile) {
            return ['gaps' => collect(), 'strengths' => collect(), 'hasMatches' => false];
        }

        $analysis = $this->skillGapAnalyzer->analyze($profile, limit: 5);

        return [
            'gaps' => $analysis['gaps'],
            'strengths' => $analysis['strengths'],
            'hasMatches' => $analysis['totalMatches'] > 0,
        ];
    }

    /**
     * @return array<int, array{month: string, applied: int}>
     */
    private function applicationActivityByMonth(User $user): array
    {
        $profile = $user->graduateProfile;
        $since = now()->subMonths(5)->startOfMonth();

        $applications = $profile
            ? $profile->jobApplications()->where('applied_at', '>=', $since)->get(['applied_at'])
            : collect();

        $byMonth = $applications->groupBy(fn (JobApplication $a) => $a->applied_at?->format('Y-m'));

        return $this->lastSixMonths(fn (string $key, string $label) => [
            'month' => $label,
            'applied' => $byMonth->get($key)?->count() ?? 0,
        ]);
    }

    /**
     * @return array<int, array{company: string, position: string, match: int|null, status: string, date: string|null}>
     */
    private function recentApplications(User $user, int $limit = 5): array
    {
        $profile = $user->graduateProfile;
        if (! $profile) {
            return [];
        }

        return $profile->jobApplications()
            ->with('jobPosting.company')
            ->latest('applied_at')
            ->limit($limit)
            ->get()
            ->map(function (JobApplication $application) use ($profile) {
                $match = JobMatchResult::where('job_posting_id', $application->job_posting_id)
                    ->where('graduate_profile_id', $profile->id)
                    ->first();

                return [
                    'company' => $application->jobPosting->company?->name ?? 'Unknown',
                    'position' => $application->jobPosting->title,
                    'match' => $match?->fit_score,
                    'status' => $application->status,
                    'date' => $application->applied_at?->format('M j'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, done: bool}>
     */
    private function profileChecklist(?GraduateProfile $profile): array
    {
        if (! $profile) {
            return [
                ['label' => 'Basic Info', 'done' => false],
                ['label' => 'Education', 'done' => false],
                ['label' => 'Skills', 'done' => false],
                ['label' => 'Employment', 'done' => false],
                ['label' => 'Résumé', 'done' => false],
            ];
        }

        return [
            ['label' => 'Basic Info', 'done' => filled($profile->headline) && filled($profile->summary)],
            ['label' => 'Education', 'done' => $profile->educationRecords()->exists()],
            ['label' => 'Skills', 'done' => $profile->skills()->exists()],
            ['label' => 'Employment', 'done' => $profile->employmentRecords()->exists()],
            ['label' => 'Résumé', 'done' => $profile->resumes()->exists()],
        ];
    }

    /**
     * Build a 6-entry series (oldest to newest month) using a callback that
     * receives the 'Y-m' lookup key and the short display label ('Jan', …).
     *
     * @param  callable(string, string): array<string, mixed>  $build
     * @return array<int, array<string, mixed>>
     */
    private function lastSixMonths(callable $build): array
    {
        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $series[] = $build($month->format('Y-m'), $month->format('M'));
        }

        return $series;
    }

    private function percent(int $part, int $whole): string
    {
        if ($whole === 0) {
            return '0%';
        }

        return round($part / $whole * 100).'%';
    }
}

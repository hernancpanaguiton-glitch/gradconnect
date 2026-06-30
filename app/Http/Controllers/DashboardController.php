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
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        [$component, $stats] = match (true) {
            $user->hasRole('admin') => ['Dashboards/AdminDashboard', $this->adminStats()],
            $user->hasRole('alumni_affairs') => ['Dashboards/AlumniAffairsDashboard', $this->alumniAffairsStats()],
            $user->hasRole('department_head') => ['Dashboards/DepartmentHeadDashboard', $this->departmentHeadStats($user)],
            $user->hasRole('industry_partner') => ['Dashboards/IndustryPartnerDashboard', $this->industryPartnerStats($user)],
            $user->hasRole('student') => ['Dashboards/StudentDashboard', $this->graduateStats($user, isStudent: true)],
            default => ['Dashboards/AlumniDashboard', $this->graduateStats($user, isStudent: false)],
        };

        return Inertia::render($component, ['stats' => $stats]);
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
        $departmentIds = $this->departmentScope($user);

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

        $pendingSurveys = Survey::where('status', 'open')
            ->whereDoesntHave('responses', fn ($query) => $query->where('user_id', $user->id))
            ->count();

        return [
            ['label' => 'Profile Completion', 'value' => "{$completion}%", 'sub' => 'Complete your profile'],
            ['label' => 'Job Recommendations', 'value' => $recommendations, 'sub' => 'Based on your profile'],
            ['label' => 'Applications', 'value' => $applications, 'sub' => 'Active applications'],
            ['label' => 'Pending Surveys', 'value' => $pendingSurveys, 'sub' => 'Waiting for response'],
        ];
    }

    /**
     * Department head analytics include the head's own department and its child programs.
     *
     * @return array<int, int>
     */
    private function departmentScope(User $user): array
    {
        if ($user->department_id === null) {
            return [];
        }

        $childIds = Department::where('parent_id', $user->department_id)->pluck('id')->all();

        return array_merge([$user->department_id], $childIds);
    }

    private function percent(int $part, int $whole): string
    {
        if ($whole === 0) {
            return '0%';
        }

        return round($part / $whole * 100).'%';
    }
}

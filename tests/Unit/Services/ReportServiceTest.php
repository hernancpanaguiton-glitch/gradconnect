<?php

namespace Tests\Unit\Services;

use App\Models\Company;
use App\Models\Department;
use App\Models\EmployerFeedback;
use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\ReportService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->service = new ReportService;
    }

    private function makePosting(): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
    }

    public function test_employability_summary_counts_everyone_with_no_filters(): void
    {
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['current_employment_status' => 'employed']);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['current_employment_status' => 'unemployed']);

        $summary = $this->service->employabilitySummary();

        $this->assertSame(2, $summary['totalGraduates']);
        $this->assertSame(1, $summary['employmentBreakdown']['employed']);
        $this->assertSame(1, $summary['employmentBreakdown']['unemployed']);
    }

    public function test_department_ids_filter_scopes_the_summary(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'COB', 'code' => 'COB', 'type' => 'college']);

        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $cob->id]);

        $summary = $this->service->employabilitySummary(['department_ids' => [$ccs->id]]);

        $this->assertSame(1, $summary['totalGraduates']);
    }

    public function test_graduation_year_filter_scopes_the_summary(): void
    {
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['graduation_year' => 2024]);
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['graduation_year' => 2020]);

        $summary = $this->service->employabilitySummary(['graduation_year' => 2024]);

        $this->assertSame(1, $summary['totalGraduates']);
    }

    public function test_job_relevance_rate_is_the_share_of_current_jobs_related_to_course(): void
    {
        $a = GraduateProfile::factory()->for(User::factory()->alumni())->create();
        $b = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        EmploymentRecord::create([
            'graduate_profile_id' => $a->id, 'company_name' => 'Acme', 'job_title' => 'Dev',
            'employment_type' => 'full_time', 'is_current' => true, 'is_related_to_course' => true,
        ]);
        EmploymentRecord::create([
            'graduate_profile_id' => $b->id, 'company_name' => 'Cafe', 'job_title' => 'Barista',
            'employment_type' => 'full_time', 'is_current' => true, 'is_related_to_course' => false,
        ]);

        $summary = $this->service->employabilitySummary();

        $this->assertSame(50, $summary['jobRelevanceRate']);
    }

    public function test_job_relevance_rate_is_null_with_no_current_employment(): void
    {
        GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $summary = $this->service->employabilitySummary();

        $this->assertNull($summary['jobRelevanceRate']);
    }

    public function test_average_time_to_employment_uses_graduation_year_and_first_job_start_date(): void
    {
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create(['graduation_year' => 2023]);

        EmploymentRecord::create([
            'graduate_profile_id' => $profile->id, 'company_name' => 'Acme', 'job_title' => 'Dev',
            'employment_type' => 'full_time', 'start_date' => '2023-07-01',
        ]);

        $summary = $this->service->employabilitySummary();

        // Jan 1 2023 -> Jul 1 2023 = 6 months.
        $this->assertSame(6, $summary['avgTimeToEmploymentMonths']);
    }

    public function test_average_time_to_employment_is_null_without_graduation_year_or_employment(): void
    {
        GraduateProfile::factory()->for(User::factory()->alumni())->create(['graduation_year' => null]);

        $summary = $this->service->employabilitySummary();

        $this->assertNull($summary['avgTimeToEmploymentMonths']);
    }

    public function test_salary_distribution_groups_by_range(): void
    {
        $a = GraduateProfile::factory()->for(User::factory()->alumni())->create();
        $b = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        EmploymentRecord::create([
            'graduate_profile_id' => $a->id, 'company_name' => 'Acme', 'job_title' => 'Dev',
            'employment_type' => 'full_time', 'is_current' => true, 'monthly_salary_range' => '20000-30000',
        ]);
        EmploymentRecord::create([
            'graduate_profile_id' => $b->id, 'company_name' => 'Beta', 'job_title' => 'Dev',
            'employment_type' => 'full_time', 'is_current' => true, 'monthly_salary_range' => '20000-30000',
        ]);

        $summary = $this->service->employabilitySummary();

        $this->assertSame(2, $summary['salaryDistribution']['20000-30000']);
    }

    public function test_survey_response_rate_excludes_survey_managers_and_counts_only_submitted(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['type' => 'tracer', 'status' => 'open']);

        $responded = User::factory()->alumni()->create();
        $notResponded = User::factory()->alumni()->create();
        SurveyResponse::create(['survey_id' => $survey->id, 'user_id' => $responded->id, 'status' => 'submitted', 'submitted_at' => now()]);

        $summary = $this->service->employabilitySummary();

        $rate = collect($summary['surveyResponseRates'])->firstWhere('title', $survey->title);
        $this->assertSame(1, $rate['submitted']);
        $this->assertSame(2, $rate['eligible']);
        $this->assertSame(50, $rate['responseRate']);
    }

    public function test_top_skill_gaps_are_ranked_by_frequency_within_scope(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        $outOfScope = GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => null]);

        $jobA = $this->makePosting();
        $jobB = $this->makePosting();
        $jobC = $this->makePosting();

        $profile->matchResults()->create(['job_posting_id' => $jobA->id, 'fit_score' => 50, 'skill_gaps' => ['Docker', 'Kubernetes']]);
        $profile->matchResults()->create(['job_posting_id' => $jobB->id, 'fit_score' => 50, 'skill_gaps' => ['Docker']]);
        $outOfScope->matchResults()->create(['job_posting_id' => $jobC->id, 'fit_score' => 50, 'skill_gaps' => ['Rust']]);

        $result = $this->service->skillAnalytics(['department_ids' => [$ccs->id]]);

        $this->assertSame('Docker', $result['topSkillGaps'][0]['skill']);
        $this->assertSame(2, $result['topSkillGaps'][0]['count']);
        $this->assertCount(2, $result['topSkillGaps']); // Docker, Kubernetes — Rust excluded (out of scope).
    }

    public function test_competency_averages_are_averaged_across_feedback_in_scope(): void
    {
        $ccs = Department::create(['name' => 'CCS', 'code' => 'CCS', 'type' => 'college']);
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create(['department_id' => $ccs->id]);
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        EmployerFeedback::create([
            'company_id' => $company->id, 'graduate_profile_id' => $profile->id,
            'submitted_by_user_id' => $company->owner_user_id, 'overall_rating' => 5,
            'competency_ratings' => ['communication' => 4, 'teamwork' => 2],
        ]);
        EmployerFeedback::create([
            'company_id' => $company->id, 'graduate_profile_id' => $profile->id,
            'submitted_by_user_id' => $company->owner_user_id, 'overall_rating' => 4,
            'competency_ratings' => ['communication' => 2],
        ]);

        $result = $this->service->skillAnalytics(['department_ids' => [$ccs->id]]);

        $this->assertSame(3.0, $result['competencyAverages']['communication']);
        $this->assertSame(2.0, $result['competencyAverages']['teamwork']);
        $this->assertSame(2, $result['feedbackCount']);
    }
}

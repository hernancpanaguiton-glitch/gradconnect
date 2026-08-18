<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationsIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makePartnerWithCompany(): array
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return [$partner, $company];
    }

    public function test_graduate_without_a_profile_sees_an_empty_state(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('applications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Applications')
                ->where('hasProfile', false)
                ->has('applications', 0)
            );
    }

    public function test_graduate_sees_their_own_applications_with_stats(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        [$partner, $company] = $this->makePartnerWithCompany();

        $jobA = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        $jobB = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        JobApplication::create([
            'job_posting_id' => $jobA->id, 'graduate_profile_id' => $profile->id,
            'status' => 'shortlisted', 'applied_at' => now()->subDays(2),
        ]);
        JobApplication::create([
            'job_posting_id' => $jobB->id, 'graduate_profile_id' => $profile->id,
            'status' => 'hired', 'applied_at' => now()->subDays(5),
        ]);

        $this->actingAs($alumni)->get(route('applications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasProfile', true)
                ->has('applications', 2)
                ->where('stats.total', 2)
                ->where('stats.shortlisted', 1)
                ->where('stats.hired', 1)
                ->where('applications.0.job_posting.id', $jobA->id)
            );
    }

    public function test_graduate_does_not_see_another_graduates_applications(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $other = User::factory()->alumni()->create();
        $otherProfile = GraduateProfile::factory()->for($other, 'user')->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $job = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        JobApplication::create([
            'job_posting_id' => $job->id, 'graduate_profile_id' => $otherProfile->id,
            'status' => 'submitted', 'applied_at' => now(),
        ]);

        $this->actingAs($alumni)->get(route('applications.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('applications', 0));
    }

    public function test_applicant_can_withdraw_a_pending_application(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $job = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        $application = JobApplication::create([
            'job_posting_id' => $job->id, 'graduate_profile_id' => $profile->id,
            'status' => 'submitted', 'applied_at' => now(),
        ]);

        $this->actingAs($alumni)
            ->patch(route('applications.withdraw', $application))
            ->assertRedirect();

        $this->assertSame('withdrawn', $application->fresh()->status);
    }
}

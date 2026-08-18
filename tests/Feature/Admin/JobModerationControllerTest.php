<?php

namespace Tests\Feature\Admin;

use App\Models\Company;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobModerationControllerTest extends TestCase
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

    public function test_admin_can_list_postings_from_every_partner(): void
    {
        $admin = User::factory()->admin()->create();
        [$partnerA, $companyA] = $this->makePartnerWithCompany();
        [$partnerB, $companyB] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($companyA)->for($partnerA, 'postedBy')->open()->create();
        JobPosting::factory()->for($companyB)->for($partnerB, 'postedBy')->closed()->create();

        $this->actingAs($admin)->get(route('admin.jobs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/JobManagement')
                ->has('postings.data', 2)
                ->where('stats.total', 2)
                ->where('stats.open', 1)
                ->where('stats.closed', 1)
            );
    }

    public function test_search_filters_by_title_or_company(): void
    {
        $admin = User::factory()->admin()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create(['title' => 'Backend Engineer']);
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create(['title' => 'Marketing Associate']);

        $this->actingAs($admin)->get(route('admin.jobs', ['search' => 'Backend']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('postings.data', 1)->where('postings.data.0.title', 'Backend Engineer'));
    }

    public function test_admin_can_close_and_reopen_any_posting(): void
    {
        $admin = User::factory()->admin()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $this->actingAs($admin)
            ->patch(route('admin.jobs.update-status', $posting), ['status' => 'closed'])
            ->assertRedirect();
        $this->assertSame('closed', $posting->fresh()->status);

        $this->actingAs($admin)
            ->patch(route('admin.jobs.update-status', $posting), ['status' => 'open'])
            ->assertRedirect();
        $this->assertSame('open', $posting->fresh()->status);
    }

    public function test_admin_can_remove_any_posting(): void
    {
        $admin = User::factory()->admin()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $this->actingAs($admin)
            ->delete(route('admin.jobs.destroy', $posting))
            ->assertRedirect();

        $this->assertDatabaseMissing('job_postings', ['id' => $posting->id]);
    }

    public function test_partner_owning_the_posting_still_cannot_reach_admin_moderation_routes(): void
    {
        [$partner, $company] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $this->actingAs($partner)->get(route('admin.jobs'))->assertForbidden();
    }

    public function test_alumni_cannot_access_job_moderation(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('admin.jobs'))->assertForbidden();
    }
}

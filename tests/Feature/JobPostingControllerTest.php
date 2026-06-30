<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobPostingControllerTest extends TestCase
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

    // ─── Public job board ────────────────────────────────────────────────────

    public function test_anyone_logged_in_can_view_job_board(): void
    {
        $alumni = User::factory()->alumni()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->count(3)->create();

        $this->actingAs($alumni)->get('/jobs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Jobs/Index')
                ->has('postings.data', 3)
            );
    }

    public function test_closed_postings_do_not_appear_on_job_board(): void
    {
        $alumni = User::factory()->alumni()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->closed()->create();

        $this->actingAs($alumni)->get('/jobs')
            ->assertInertia(fn ($page) => $page->has('postings.data', 1));
    }

    public function test_job_detail_page_loads(): void
    {
        $alumni = User::factory()->alumni()->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $this->actingAs($alumni)->get("/jobs/{$posting->id}")->assertOk()
            ->assertInertia(fn ($page) => $page->component('Jobs/Show'));
    }

    // ─── Industry partner CRUD ───────────────────────────────────────────────

    public function test_industry_partner_can_view_their_postings(): void
    {
        [$partner, $company] = $this->makePartnerWithCompany();
        JobPosting::factory()->for($company)->for($partner, 'postedBy')->count(2)->create();

        $this->actingAs($partner)->get('/postings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Postings/Index'));
    }

    public function test_industry_partner_can_create_a_posting(): void
    {
        [$partner, $company] = $this->makePartnerWithCompany();

        $this->actingAs($partner)
            ->post('/postings', [
                'title' => 'Software Engineer',
                'description' => 'Build great things.',
                'employment_type' => 'full_time',
                'status' => 'open',
                'is_remote' => false,
            ])
            ->assertRedirect('/postings');

        $this->assertDatabaseHas('job_postings', ['title' => 'Software Engineer']);
    }

    public function test_alumni_cannot_create_a_posting(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post('/postings', ['title' => 'Hacked', 'description' => 'x', 'employment_type' => 'full_time', 'status' => 'open', 'is_remote' => false])
            ->assertStatus(403);

        $this->assertDatabaseMissing('job_postings', ['title' => 'Hacked']);
    }

    public function test_industry_partner_can_update_own_posting(): void
    {
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        $this->actingAs($partner)
            ->patch("/postings/{$posting->id}", [
                'title' => 'Updated Title',
                'description' => $posting->description,
                'employment_type' => $posting->employment_type,
                'status' => $posting->status,
                'is_remote' => false,
            ])
            ->assertRedirect();

        $this->assertSame('Updated Title', $posting->fresh()->title);
    }

    public function test_industry_partner_cannot_update_another_partners_posting(): void
    {
        [$partner1, $company1] = $this->makePartnerWithCompany();
        [$partner2, $company2] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company2)->for($partner2, 'postedBy')->create();

        $this->actingAs($partner1)
            ->patch("/postings/{$posting->id}", [
                'title' => 'Stolen',
                'description' => $posting->description,
                'employment_type' => $posting->employment_type,
                'status' => $posting->status,
                'is_remote' => false,
            ])
            ->assertStatus(403);
    }

    public function test_industry_partner_can_delete_own_posting(): void
    {
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        $this->actingAs($partner)
            ->delete("/postings/{$posting->id}")
            ->assertRedirect('/postings');

        $this->assertDatabaseMissing('job_postings', ['id' => $posting->id]);
    }

    // ─── Job application ─────────────────────────────────────────────────────

    public function test_alumni_can_apply_for_a_job(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $this->actingAs($alumni)
            ->post("/jobs/{$posting->id}/apply")
            ->assertRedirect();

        $this->assertDatabaseHas('job_applications', [
            'job_posting_id' => $posting->id,
            'status' => 'submitted',
        ]);
    }

    public function test_alumni_cannot_apply_twice(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        [$partner, $company] = $this->makePartnerWithCompany();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        // First application
        $this->actingAs($alumni)->post("/jobs/{$posting->id}/apply");

        // Second attempt should fail with 422 (abort_if)
        $this->actingAs($alumni)->post("/jobs/{$posting->id}/apply")
            ->assertStatus(422);
    }
}

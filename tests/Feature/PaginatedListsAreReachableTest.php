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

/**
 * Three lists paginate server-side while their pages rendered no controls,
 * so everything past the first page was unreachable — the header still
 * reported the true total, so the rows simply looked as though they did not
 * exist. These assert the payload carries what the controls need.
 */
class PaginatedListsAreReachableTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_an_employers_posting_list_can_reach_past_the_first_page(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        JobPosting::factory()->count(25)->for($company)->for($partner, 'postedBy')->create();

        $this->actingAs($partner)
            ->get(route('postings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('postings.total', 25)
                ->has('postings.data', 20)
                ->has('postings.links'));

        $this->actingAs($partner)
            ->get(route('postings.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('postings.data', 5));
    }

    public function test_an_applicant_list_can_reach_past_the_first_page(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        foreach (range(1, 35) as $ignored) {
            $graduate = User::factory()->alumni()->create();
            $profile = GraduateProfile::factory()->create(['user_id' => $graduate->id]);
            JobApplication::create([
                'job_posting_id' => $posting->id,
                'graduate_profile_id' => $profile->id,
                'status' => 'submitted',
                'applied_at' => now(),
            ]);
        }

        // 35 applicants over a page size of 30: the last five were invisible.
        $this->actingAs($partner)
            ->get(route('postings.candidates', $posting))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('applications.total', 35)
                ->has('applications.data', 30)
                ->has('applications.links'));

        $this->actingAs($partner)
            ->get(route('postings.candidates', ['posting' => $posting->id, 'page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('applications.data', 5));
    }

    public function test_the_moderation_queue_can_reach_past_the_first_page(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        JobPosting::factory()->count(25)->for($company)->for($partner, 'postedBy')->create();

        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('admin.jobs'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('postings.data', 20)
                ->has('postings.links'));

        $this->actingAs($admin)
            ->get(route('admin.jobs', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('postings.data', 5));
    }
}

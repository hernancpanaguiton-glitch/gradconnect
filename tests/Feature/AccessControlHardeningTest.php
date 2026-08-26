<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Event;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Regressions for gating gaps found in the post-build audit. Each of these
 * routes was reachable by ID, or by a role that should not have had it,
 * because the guard lived only in the listing query or the navigation.
 */
class AccessControlHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function posting(User $partner, string $status = 'open'): JobPosting
    {
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->create(['status' => $status]);
    }

    // ─── C1: Alumni Affairs' "Alumni Database" link ─────────────────────────

    public function test_alumni_affairs_can_reach_the_graduate_directory(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->get(route('talent-search'))->assertOk();
    }

    public function test_alumni_affairs_no_longer_sees_a_user_management_card_it_cannot_open(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->get(route('reports.index'))
            ->assertInertia(fn ($page) => $page->where(
                'reports',
                fn ($reports) => collect($reports)->doesntContain('title', 'User & Role Management'),
            ));

        // And the route itself is still admin-only.
        $this->actingAs($aao)->get(route('admin.users.index'))->assertForbidden();
    }

    // ─── C2: suspended accounts ─────────────────────────────────────────────

    public function test_a_suspended_user_cannot_change_their_password(): void
    {
        $user = User::factory()->alumni()->create([
            'status' => 'suspended',
            'password' => Hash::make('old-password'),
        ]);

        $this->actingAs($user)->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertRedirect(route('login'));

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
        $this->assertGuest();
    }

    public function test_an_active_user_can_still_change_their_password(): void
    {
        $user = User::factory()->alumni()->create(['password' => Hash::make('old-password')]);

        $this->actingAs($user)->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    // ─── C3: non-open postings ──────────────────────────────────────────────

    public function test_a_graduate_cannot_open_a_draft_posting_by_id(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $draft = $this->posting($partner, 'draft');
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('jobs.show', $draft))->assertNotFound();
    }

    public function test_the_owning_partner_can_still_open_their_own_draft(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $draft = $this->posting($partner, 'draft');

        $this->actingAs($partner)->get(route('jobs.show', $draft))->assertOk();
    }

    public function test_an_open_posting_is_still_visible_to_graduates(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $open = $this->posting($partner);
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('jobs.show', $open))->assertOk();
    }

    public function test_a_closed_posting_cannot_collect_new_applications(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $closed = $this->posting($partner, 'closed');
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->post(route('applications.store', $closed), [])->assertStatus(422);

        $this->assertDatabaseCount('job_applications', 0);
    }

    public function test_a_role_without_jobs_apply_cannot_apply(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $open = $this->posting($partner);

        // Alumni Affairs holds no jobs.apply permission.
        $aao = User::factory()->alumniAffairs()->create();
        GraduateProfile::factory()->for($aao, 'user')->create();

        $this->actingAs($aao)->post(route('applications.store', $open), [])->assertForbidden();
    }

    // ─── C4: unpublished events ─────────────────────────────────────────────

    public function test_a_draft_event_cannot_collect_rsvps(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $draft = Event::factory()->for($aao, 'createdBy')->create(['status' => 'draft']);
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('events.rsvp', $draft), ['status' => 'going'])
            ->assertStatus(422);

        $this->assertDatabaseCount('event_rsvps', 0);
    }

    public function test_a_manager_may_still_rsvp_to_their_own_draft_while_previewing(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $draft = Event::factory()->for($aao, 'createdBy')->create(['status' => 'draft']);

        $this->actingAs($aao)->post(route('events.rsvp', $draft), ['status' => 'going'])->assertRedirect();
    }

    public function test_a_published_event_still_accepts_rsvps(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $event = Event::factory()->for($aao, 'createdBy')->create(['status' => 'published']);
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('events.rsvp', $event), ['status' => 'going'])->assertRedirect();

        $this->assertDatabaseHas('event_rsvps', ['event_id' => $event->id, 'user_id' => $alumni->id]);
    }
}

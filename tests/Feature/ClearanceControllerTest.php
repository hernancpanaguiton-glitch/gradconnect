<?php

namespace Tests\Feature;

use App\Models\ClearanceRecord;
use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClearanceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_alumni_sees_their_own_checklist_all_pending_by_default(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->get(route('clearance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Clearance')
                ->where('mode', 'own')
                ->has('checklist', 6)
                ->where('checklist.0.status', 'pending')
            );
    }

    public function test_sao_sees_institution_wide_progress(): void
    {
        $sao = User::factory()->sao()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();
        ClearanceRecord::create(['graduate_profile_id' => $profile->id, 'office' => 'library', 'status' => 'cleared', 'cleared_at' => now()]);

        $this->actingAs($sao)->get(route('clearance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('mode', 'manager')
                ->where('totalGraduates', 1)
                ->has('officeProgress', 6)
            );
    }

    public function test_sao_can_mark_an_office_cleared_for_a_specific_graduate(): void
    {
        $sao = User::factory()->sao()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $this->actingAs($sao)->patch(route('clearance.update', $profile), [
            'office' => 'library', 'status' => 'cleared',
        ])->assertRedirect();

        $this->assertDatabaseHas('clearance_records', [
            'graduate_profile_id' => $profile->id, 'office' => 'library', 'status' => 'cleared', 'cleared_by_user_id' => $sao->id,
        ]);
    }

    public function test_reverting_to_pending_clears_the_cleared_by_and_date(): void
    {
        $sao = User::factory()->sao()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();
        ClearanceRecord::create([
            'graduate_profile_id' => $profile->id, 'office' => 'library', 'status' => 'cleared',
            'cleared_by_user_id' => $sao->id, 'cleared_at' => now(),
        ]);

        $this->actingAs($sao)->patch(route('clearance.update', $profile), ['office' => 'library', 'status' => 'pending']);

        $this->assertDatabaseHas('clearance_records', [
            'graduate_profile_id' => $profile->id, 'office' => 'library', 'status' => 'pending',
            'cleared_by_user_id' => null, 'cleared_at' => null,
        ]);
    }

    public function test_alumni_cannot_update_clearance(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->patch(route('clearance.update', $profile), ['office' => 'library', 'status' => 'cleared'])
            ->assertForbidden();
    }

    public function test_invalid_office_is_rejected(): void
    {
        $sao = User::factory()->sao()->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $this->actingAs($sao)->patch(route('clearance.update', $profile), ['office' => 'made_up', 'status' => 'cleared'])
            ->assertSessionHasErrors('office');
    }
}

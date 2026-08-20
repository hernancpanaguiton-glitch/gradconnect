<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\Scholarship;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarshipControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sao_can_view_and_create_a_scholarship(): void
    {
        $sao = User::factory()->sao()->create();

        $this->actingAs($sao)->get(route('scholarships'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Scholarships')->has('scholarships', 0));

        $this->actingAs($sao)->post(route('scholarships.store'), [
            'name' => 'CHED UniFAST', 'status' => 'active', 'budget_amount' => 50000,
        ])->assertRedirect();

        $this->assertDatabaseHas('scholarships', ['name' => 'CHED UniFAST', 'created_by_user_id' => $sao->id]);
    }

    public function test_alumni_cannot_access_scholarships(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('scholarships'))->assertForbidden();
        $this->actingAs($alumni)->post(route('scholarships.store'), ['name' => 'x', 'status' => 'active'])->assertForbidden();
    }

    public function test_sao_can_add_and_remove_a_recipient(): void
    {
        $sao = User::factory()->sao()->create();
        $scholarship = Scholarship::factory()->for($sao, 'createdBy')->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $this->actingAs($sao)->post(route('scholarships.recipients.store', $scholarship), [
            'graduate_profile_id' => $profile->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('scholarship_recipients', ['scholarship_id' => $scholarship->id, 'graduate_profile_id' => $profile->id]);

        $recipient = $scholarship->recipients()->first();
        $this->actingAs($sao)->delete(route('scholarships.recipients.destroy', $recipient))->assertRedirect();

        $this->assertDatabaseCount('scholarship_recipients', 0);
    }

    public function test_adding_the_same_recipient_twice_does_not_duplicate(): void
    {
        $sao = User::factory()->sao()->create();
        $scholarship = Scholarship::factory()->for($sao, 'createdBy')->create();
        $profile = GraduateProfile::factory()->for(User::factory()->alumni())->create();

        $this->actingAs($sao)->post(route('scholarships.recipients.store', $scholarship), ['graduate_profile_id' => $profile->id]);
        $this->actingAs($sao)->post(route('scholarships.recipients.store', $scholarship), ['graduate_profile_id' => $profile->id]);

        $this->assertSame(1, $scholarship->recipients()->count());
    }

    public function test_sao_can_delete_a_scholarship(): void
    {
        $sao = User::factory()->sao()->create();
        $scholarship = Scholarship::factory()->for($sao, 'createdBy')->create();

        $this->actingAs($sao)->delete(route('scholarships.destroy', $scholarship))->assertRedirect();

        $this->assertDatabaseMissing('scholarships', ['id' => $scholarship->id]);
    }
}

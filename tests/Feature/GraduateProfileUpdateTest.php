<?php

namespace Tests\Feature;

use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GraduateProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Build an update payload mirroring what the Basic Info form re-submits:
     * every existing field is sent back alongside the changed ones. This is
     * what surfaces validation drift between the factory/seed and the request
     * rules (e.g. a bad gender casing silently rejecting the whole update).
     *
     * @return array<string, mixed>
     */
    private function formPayload(GraduateProfile $profile, array $overrides = []): array
    {
        return array_merge([
            'program' => $profile->program,
            'graduation_year' => $profile->graduation_year,
            'gender' => $profile->gender,
            'birthdate' => optional($profile->birthdate)->format('Y-m-d'),
            'phone' => $profile->phone,
            'city' => $profile->city,
            'headline' => $profile->headline,
            'summary' => $profile->summary,
            'current_employment_status' => $profile->current_employment_status,
            'willing_to_relocate' => $profile->willing_to_relocate,
        ], $overrides);
    }

    public function test_alumni_can_update_employment_status_and_relocation(): void
    {
        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->unemployed()->create([
            'user_id' => $user->id,
            'willing_to_relocate' => false,
        ]);

        $response = $this->actingAs($user)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, [
                'current_employment_status' => 'employed',
                'willing_to_relocate' => true,
            ])
        );

        $response->assertSessionHasNoErrors();

        $profile->refresh();
        $this->assertSame('employed', $profile->current_employment_status);
        $this->assertTrue($profile->willing_to_relocate);
    }

    public function test_factory_profiles_pass_the_update_validation_rules(): void
    {
        $user = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $user->id]);

        // Re-submitting the profile unchanged must not trip any validation rule.
        $this->actingAs($user)
            ->patch(route('graduate.profile.update'), $this->formPayload($profile))
            ->assertSessionHasNoErrors();
    }

    public function test_employability_report_reflects_status_change(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->unemployed()->create(['user_id' => $alumni->id]);

        $affairs = User::factory()->alumniAffairs()->create();

        // Baseline: the profile counts as unemployed.
        $this->actingAs($affairs)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('employmentBreakdown.unemployed', 1));

        // Alumni marks themselves employed.
        $this->actingAs($alumni)->patch(
            route('graduate.profile.update'),
            $this->formPayload($profile, ['current_employment_status' => 'employed'])
        )->assertSessionHasNoErrors();

        // The report now counts them.
        $this->actingAs($affairs)->get(route('reports.employability'))
            ->assertInertia(fn ($page) => $page->where('employmentBreakdown.employed', 1));
    }
}

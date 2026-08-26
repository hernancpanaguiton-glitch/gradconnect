<?php

namespace Tests\Feature;

use App\Models\EducationRecord;
use App\Models\EmploymentRecord;
use App\Models\GraduateProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * EducationRecordController and EmploymentRecordController were entirely
 * untested, including the ownership checks that are the only thing standing
 * between one graduate and another's records — the same class of gap that
 * turned out to be a real hole elsewhere in the audit.
 */
class GraduateRecordOwnershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * @return array{0: User, 1: GraduateProfile}
     */
    private function graduate(): array
    {
        $user = User::factory()->alumni()->create();

        return [$user, GraduateProfile::factory()->for($user, 'user')->create()];
    }

    private function educationPayload(array $overrides = []): array
    {
        return array_merge([
            'institution' => 'University of Cebu Lapu-Lapu and Mandaue',
            'degree' => 'BS Information Technology',
            'field_of_study' => 'Information Technology',
            'start_year' => 2019,
            'end_year' => 2023,
        ], $overrides);
    }

    private function employmentPayload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => 'Sugbo Software Labs',
            'job_title' => 'Backend Developer',
            'employment_type' => 'full_time',
            'is_current' => true,
        ], $overrides);
    }

    // ─── Education records ───────────────────────────────────────────────────

    public function test_a_graduate_can_add_update_and_remove_their_own_education(): void
    {
        [$user, $profile] = $this->graduate();

        $this->actingAs($user)->post(route('education.store'), $this->educationPayload())
            ->assertSessionHasNoErrors();

        $record = EducationRecord::where('graduate_profile_id', $profile->id)->firstOrFail();

        $this->actingAs($user)->patch(route('education.update', $record), $this->educationPayload([
            'degree' => 'BS Computer Science',
        ]))->assertSessionHasNoErrors();

        $this->assertSame('BS Computer Science', $record->fresh()->degree);

        $this->actingAs($user)->delete(route('education.destroy', $record))->assertRedirect();
        $this->assertDatabaseMissing('education_records', ['id' => $record->id]);
    }

    public function test_a_graduate_cannot_update_another_graduates_education(): void
    {
        [, $ownerProfile] = $this->graduate();
        $record = EducationRecord::factory()->create(['graduate_profile_id' => $ownerProfile->id]);

        [$intruder] = $this->graduate();

        $this->actingAs($intruder)->patch(route('education.update', $record), $this->educationPayload([
            'institution' => 'Tampered',
        ]))->assertForbidden();

        $this->assertNotSame('Tampered', $record->fresh()->institution);
    }

    public function test_a_graduate_cannot_delete_another_graduates_education(): void
    {
        [, $ownerProfile] = $this->graduate();
        $record = EducationRecord::factory()->create(['graduate_profile_id' => $ownerProfile->id]);

        [$intruder] = $this->graduate();

        $this->actingAs($intruder)->delete(route('education.destroy', $record))->assertForbidden();
        $this->assertDatabaseHas('education_records', ['id' => $record->id]);
    }

    public function test_education_requires_an_institution(): void
    {
        [$user] = $this->graduate();

        $this->actingAs($user)->post(route('education.store'), $this->educationPayload(['institution' => '']))
            ->assertSessionHasErrors('institution');
    }

    // ─── Employment records ──────────────────────────────────────────────────

    public function test_a_graduate_can_add_update_and_remove_their_own_employment(): void
    {
        [$user, $profile] = $this->graduate();

        $this->actingAs($user)->post(route('employment.store'), $this->employmentPayload())
            ->assertSessionHasNoErrors();

        $record = EmploymentRecord::where('graduate_profile_id', $profile->id)->firstOrFail();

        $this->actingAs($user)->patch(route('employment.update', $record), $this->employmentPayload([
            'job_title' => 'Senior Backend Developer',
        ]))->assertSessionHasNoErrors();

        $this->assertSame('Senior Backend Developer', $record->fresh()->job_title);

        $this->actingAs($user)->delete(route('employment.destroy', $record))->assertRedirect();
        $this->assertDatabaseMissing('employment_records', ['id' => $record->id]);
    }

    public function test_a_graduate_cannot_update_another_graduates_employment(): void
    {
        [, $ownerProfile] = $this->graduate();
        $record = EmploymentRecord::factory()->create(['graduate_profile_id' => $ownerProfile->id]);

        [$intruder] = $this->graduate();

        $this->actingAs($intruder)->patch(route('employment.update', $record), $this->employmentPayload([
            'company_name' => 'Tampered',
        ]))->assertForbidden();

        $this->assertNotSame('Tampered', $record->fresh()->company_name);
    }

    public function test_a_graduate_cannot_delete_another_graduates_employment(): void
    {
        [, $ownerProfile] = $this->graduate();
        $record = EmploymentRecord::factory()->create(['graduate_profile_id' => $ownerProfile->id]);

        [$intruder] = $this->graduate();

        $this->actingAs($intruder)->delete(route('employment.destroy', $record))->assertForbidden();
        $this->assertDatabaseHas('employment_records', ['id' => $record->id]);
    }

    public function test_employment_requires_a_company_and_job_title(): void
    {
        [$user] = $this->graduate();

        $this->actingAs($user)->post(route('employment.store'), $this->employmentPayload([
            'company_name' => '', 'job_title' => '',
        ]))->assertSessionHasErrors(['company_name', 'job_title']);
    }

    public function test_an_industry_partner_cannot_touch_graduate_records(): void
    {
        [, $ownerProfile] = $this->graduate();
        $education = EducationRecord::factory()->create(['graduate_profile_id' => $ownerProfile->id]);

        $partner = User::factory()->industryPartner()->create();

        // Blocked at the route's role gate rather than the ownership check.
        $this->actingAs($partner)->delete(route('education.destroy', $education))->assertForbidden();
        $this->assertDatabaseHas('education_records', ['id' => $education->id]);
    }
}

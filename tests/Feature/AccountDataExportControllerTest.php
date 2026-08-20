<?php

namespace Tests\Feature;

use App\Models\EducationRecord;
use App\Models\GraduateProfile;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountDataExportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_authenticated_user_can_export_their_own_data(): void
    {
        $alumni = User::factory()->alumni()->create(['first_name' => 'Jane', 'last_name' => 'Doe']);
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create(['headline' => 'Backend Developer']);
        EducationRecord::create(['graduate_profile_id' => $profile->id, 'institution' => 'UCLM', 'degree' => 'BSIT']);
        $profile->skills()->attach(Skill::findOrCreateByName('Laravel')->id, ['source' => 'self']);

        $response = $this->actingAs($alumni)->get(route('account.export'));

        $response->assertOk();
        $this->assertStringContainsString('application/json', $response->headers->get('Content-Type'));

        $data = json_decode($response->streamedContent(), true);
        $this->assertSame('Jane', $data['account']['first_name']);
        $this->assertSame('Backend Developer', $data['profile']['headline']);
        $this->assertSame('UCLM', $data['education'][0]['institution']);
        $this->assertContains('Laravel', $data['skills']);
    }

    public function test_export_does_not_include_another_users_data(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create(['headline' => 'Mine']);

        $other = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($other, 'user')->create(['headline' => 'Not Mine']);

        $response = $this->actingAs($alumni)->get(route('account.export'));
        $data = json_decode($response->streamedContent(), true);

        $this->assertSame('Mine', $data['profile']['headline']);
    }

    public function test_export_works_even_without_a_graduate_profile(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $response = $this->actingAs($partner)->get(route('account.export'));

        $response->assertOk();
        $data = json_decode($response->streamedContent(), true);
        $this->assertNull($data['profile']);
    }
}

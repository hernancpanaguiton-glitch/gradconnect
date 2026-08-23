<?php

namespace Tests\Feature\Admin;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_settings_with_defaults(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SystemSettings')
                ->where('settings.registration_enabled', true)
            );
    }

    public function test_admin_can_update_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.settings.update'), [
            'registration_enabled' => false,
            'support_email' => 'help@gradconnect.edu.ph',
            'maintenance_banner_message' => 'Scheduled downtime tonight.',
            'matching_min_fit_score' => 40,
        ])->assertRedirect();

        $this->assertFalse(Setting::getBool('registration_enabled'));
        $this->assertSame('help@gradconnect.edu.ph', Setting::get('support_email'));
        $this->assertSame('Scheduled downtime tonight.', Setting::get('maintenance_banner_message'));
        $this->assertSame(40, Setting::getInt('matching_min_fit_score'));

        $this->assertDatabaseHas('audit_logs', ['action' => 'settings.updated', 'user_id' => $admin->id]);
    }

    public function test_non_admin_cannot_view_or_update_settings(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('admin.settings.index'))->assertForbidden();
        $this->actingAs($alumni)->patch(route('admin.settings.update'), ['registration_enabled' => false])->assertForbidden();
    }

    public function test_invalid_support_email_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.settings.update'), [
            'registration_enabled' => true, 'support_email' => 'not-an-email', 'matching_min_fit_score' => 0,
        ])->assertSessionHasErrors('support_email');
    }

    public function test_fit_score_threshold_must_be_between_0_and_100(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->patch(route('admin.settings.update'), [
            'registration_enabled' => true, 'matching_min_fit_score' => 150,
        ])->assertSessionHasErrors('matching_min_fit_score');
    }
}

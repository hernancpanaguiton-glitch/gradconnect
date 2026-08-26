<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\ApplicationStatusUpdated;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_settings_page_renders_real_account_data_and_preferences(): void
    {
        $user = User::factory()->alumni()->create([
            'first_name' => 'Maria', 'last_name' => 'Reyes', 'email' => 'maria@example.com',
        ]);

        $this->actingAs($user)->get(route('settings'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings')
                ->where('account.first_name', 'Maria')
                ->where('account.email', 'maria@example.com')
                ->has('notificationPreferences', count(NotificationPreference::KEYS))
                ->where('notificationPreferences.0.enabled', true)
            );
    }

    public function test_account_form_posts_to_the_working_breeze_endpoint(): void
    {
        $user = User::factory()->alumni()->create(['first_name' => 'Old', 'email' => 'old@example.com']);

        $this->actingAs($user)->patch(route('profile.update'), [
            'first_name' => 'New', 'last_name' => 'Name', 'email' => 'new@example.com',
        ])->assertRedirect();

        $user->refresh();
        $this->assertSame('New', $user->first_name);
        $this->assertSame('new@example.com', $user->email);
        // Changing email must re-trigger verification.
        $this->assertNull($user->email_verified_at);
    }

    public function test_password_form_posts_to_the_working_breeze_endpoint(): void
    {
        $user = User::factory()->alumni()->create(['password' => Hash::make('old-password')]);

        $this->actingAs($user)->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_wrong_current_password_is_rejected(): void
    {
        $user = User::factory()->alumni()->create(['password' => Hash::make('old-password')]);

        $this->actingAs($user)->put(route('password.update'), [
            'current_password' => 'not-it',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    // ─── Notification preferences ────────────────────────────────────────────

    public function test_preferences_default_to_on_when_never_configured(): void
    {
        $user = User::factory()->alumni()->create();

        $this->assertTrue($user->wantsNotification('announcements'));
    }

    public function test_user_can_save_notification_preferences(): void
    {
        $user = User::factory()->alumni()->create();

        $this->actingAs($user)->patch(route('settings.notifications.update'), [
            'preferences' => [
                ['key' => 'announcements', 'enabled' => false],
                ['key' => 'application_updates', 'enabled' => true],
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $user->id, 'preference_key' => 'announcements', 'enabled' => false,
        ]);
        $this->assertFalse($user->fresh()->wantsNotification('announcements'));
    }

    public function test_saving_twice_updates_rather_than_duplicating(): void
    {
        $user = User::factory()->alumni()->create();
        $payload = ['preferences' => [['key' => 'announcements', 'enabled' => false]]];

        $this->actingAs($user)->patch(route('settings.notifications.update'), $payload);
        $this->actingAs($user)->patch(route('settings.notifications.update'), $payload);

        $this->assertSame(1, NotificationPreference::where('user_id', $user->id)->count());
    }

    public function test_unknown_preference_key_is_rejected(): void
    {
        $user = User::factory()->alumni()->create();

        $this->actingAs($user)->patch(route('settings.notifications.update'), [
            'preferences' => [['key' => 'made_up_key', 'enabled' => false]],
        ])->assertSessionHasErrors('preferences.0.key');

        $this->assertDatabaseCount('notification_preferences', 0);
    }

    /**
     * The toggle has to actually suppress delivery, not just store a row.
     */
    public function test_disabling_a_category_suppresses_that_notification(): void
    {
        Notification::fake();

        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $application = JobApplication::create([
            'job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id,
            'status' => 'submitted', 'applied_at' => now(),
        ]);

        NotificationPreference::create([
            'user_id' => $alumni->id, 'preference_key' => 'application_updates', 'enabled' => false,
        ]);

        $this->actingAs($partner)->patch(route('applications.update-status', $application), [
            'status' => 'shortlisted',
        ])->assertSessionHasNoErrors();

        Notification::assertNotSentTo($alumni, ApplicationStatusUpdated::class);
    }

    public function test_leaving_a_category_enabled_still_delivers(): void
    {
        Notification::fake();

        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $application = JobApplication::create([
            'job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id,
            'status' => 'submitted', 'applied_at' => now(),
        ]);

        $this->actingAs($partner)->patch(route('applications.update-status', $application), [
            'status' => 'shortlisted',
        ]);

        Notification::assertSentTo($alumni, ApplicationStatusUpdated::class);
    }
}

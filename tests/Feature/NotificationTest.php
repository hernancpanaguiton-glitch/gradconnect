<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\User;
use App\Notifications\AccountApproved;
use App\Notifications\ApplicationReceived;
use App\Notifications\ApplicationStatusUpdated;
use App\Notifications\NewAccountPendingApproval;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * @return array{0: User, 1: JobPosting, 2: User, 3: GraduateProfile}
     */
    private function scenario(): array
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->create(['user_id' => $alumni->id]);

        return [$partner, $posting, $alumni, $profile];
    }

    public function test_employer_is_notified_when_a_candidate_applies(): void
    {
        Notification::fake();
        [$partner, $posting, $alumni] = $this->scenario();

        $this->actingAs($alumni)
            ->post(route('applications.store', $posting), ['cover_letter' => 'Hi'])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($partner, ApplicationReceived::class);
    }

    public function test_applicant_is_notified_on_status_change(): void
    {
        Notification::fake();
        [$partner, $posting, $alumni, $profile] = $this->scenario();
        $application = JobApplication::create([
            'job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id,
            'status' => 'submitted', 'applied_at' => now(),
        ]);

        $this->actingAs($partner)
            ->patch(route('applications.update-status', $application), ['status' => 'shortlisted'])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($alumni, ApplicationStatusUpdated::class);
    }

    public function test_user_is_notified_when_admin_approves_their_account(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $pending = User::factory()->pending()->create();
        $pending->assignRole('department_head');

        $this->actingAs($admin)
            ->patch(route('admin.users.update', $pending), [
                'status' => 'active', 'roles' => ['department_head'],
            ])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($pending, AccountApproved::class);
    }

    public function test_no_approval_notification_when_user_was_already_active(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $active = User::factory()->create(['status' => 'active']);
        $active->assignRole('alumni');

        $this->actingAs($admin)
            ->patch(route('admin.users.update', $active), [
                'status' => 'active', 'roles' => ['alumni'],
            ])
            ->assertSessionHasNoErrors();

        Notification::assertNothingSentTo($active);
    }

    public function test_admins_are_notified_when_a_pending_account_registers(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();

        $this->post('/register', [
            'first_name' => 'Dean', 'last_name' => 'Cruz',
            'email' => 'dean@example.com', 'password' => 'password',
            'password_confirmation' => 'password', 'role' => 'dean',
        ])->assertRedirect(route('login'));

        Notification::assertSentTo($admin, NewAccountPendingApproval::class);
    }

    public function test_admins_are_not_notified_when_a_graduate_registers(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();

        $this->post('/register', [
            'first_name' => 'Stu', 'last_name' => 'Dent',
            'email' => 'stu@example.com', 'password' => 'password',
            'password_confirmation' => 'password', 'role' => 'student',
        ]);

        Notification::assertNotSentTo($admin, NewAccountPendingApproval::class);
    }

    public function test_notification_email_uses_the_branded_theme(): void
    {
        $user = User::factory()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);

        $html = (string) (new AccountApproved)->toMail($user)->render();

        // The GradConnect theme's primary blue is present in the rendered email.
        $this->assertStringContainsString('1a56db', $html);
    }

    public function test_notifications_page_loads_and_marks_all_read(): void
    {
        $user = User::factory()->alumni()->create();
        $user->notify(new AccountApproved);

        $this->assertSame(1, $user->fresh()->unreadNotifications()->count());

        $this->actingAs($user)->get(route('notifications'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Notifications')->has('notifications.data', 1));

        $this->actingAs($user)->patch(route('notifications.read-all'))->assertRedirect();
        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }
}

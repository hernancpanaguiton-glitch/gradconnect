<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use App\Notifications\AccountApproved;
use App\Notifications\AnnouncementPublished;
use App\Notifications\ApplicationReceived;
use App\Notifications\ApplicationStatusUpdated;
use App\Notifications\NewAccountPendingApproval;
use App\Notifications\SurveyInvitation;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification as BaseNotification;
use Tests\TestCase;

/**
 * Mail leaves the platform and is stored on servers we do not control, so no
 * notification may carry a person's name or address. The same details are
 * fine in the in-app (database) channel, which sits behind the sign-in.
 */
class EmailPrivacyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * @return array{0: User, 1: User, 2: JobApplication}
     */
    private function application(): array
    {
        $employer = User::factory()->industryPartner()->create(['first_name' => 'Elena', 'last_name' => 'Cruz']);
        $company = Company::factory()->for($employer, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($employer, 'postedBy')->open()->create();

        $applicant = User::factory()->alumni()->create(['first_name' => 'Zandro', 'last_name' => 'Villaflor']);
        $profile = GraduateProfile::factory()->create(['user_id' => $applicant->id]);

        $application = JobApplication::create([
            'job_posting_id' => $posting->id,
            'graduate_profile_id' => $profile->id,
            'status' => 'submitted',
            'applied_at' => now(),
        ]);

        return [$employer, $applicant, $application];
    }

    private function assertMailHasNoPersonalData(BaseNotification $notification, User $recipient, User $subject): void
    {
        $mail = $notification->toMail($recipient);
        $rendered = $mail->subject.' '.json_encode($mail->toArray());

        foreach ([$subject->first_name, $subject->last_name, $subject->name, $subject->email] as $secret) {
            $this->assertStringNotContainsStringIgnoringCase(
                (string) $secret,
                $rendered,
                class_basename($notification).' leaks personal data into email.'
            );
        }
    }

    public function test_application_received_email_does_not_name_the_applicant(): void
    {
        [$employer, $applicant, $application] = $this->application();

        $notification = new ApplicationReceived($application);

        $this->assertMailHasNoPersonalData($notification, $employer, $applicant);

        // The in-app notification still names them, so the employer can act.
        $this->assertStringContainsString($applicant->name, $notification->toDatabase($employer)['message']);
    }

    public function test_pending_approval_email_does_not_identify_the_registrant(): void
    {
        $admin = User::factory()->admin()->create();
        $registrant = User::factory()->create(['first_name' => 'Zandro', 'last_name' => 'Villaflor']);
        $registrant->assignRole('sao');

        $notification = new NewAccountPendingApproval($registrant);

        $this->assertMailHasNoPersonalData($notification, $admin, $registrant);

        // The role still reads properly rather than as "Sao".
        $this->assertStringContainsString('Student Affairs Office', json_encode($notification->toMail($admin)->toArray()));
        $this->assertStringContainsString($registrant->name, $notification->toDatabase($admin)['message']);
    }

    public function test_account_approved_email_does_not_greet_by_name(): void
    {
        $user = User::factory()->alumni()->create(['first_name' => 'Zandro', 'last_name' => 'Villaflor']);

        $this->assertMailHasNoPersonalData(new AccountApproved, $user, $user);
    }

    public function test_application_status_email_does_not_name_the_applicant(): void
    {
        [, $applicant, $application] = $this->application();

        $this->assertMailHasNoPersonalData(new ApplicationStatusUpdated($application), $applicant, $applicant);
    }

    public function test_announcement_email_does_not_copy_the_body(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $recipient = User::factory()->alumni()->create(['first_name' => 'Zandro', 'last_name' => 'Villaflor']);

        // Staff free text can describe a third party, so it is never mailed.
        $announcement = Announcement::factory()->create([
            'created_by_user_id' => $staff->id,
            'title' => 'Campus job fair',
            'body' => 'Contact Zandro Villaflor at zandro@example.com to register.',
        ]);

        $rendered = json_encode((new AnnouncementPublished($announcement))->toMail($recipient)->toArray());

        $this->assertStringNotContainsString('zandro@example.com', $rendered);
        $this->assertStringNotContainsString('Zandro Villaflor', $rendered);
        $this->assertStringContainsString('Campus job fair', $rendered);
    }

    public function test_survey_invitation_email_does_not_copy_the_description(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $recipient = User::factory()->alumni()->create();

        $survey = Survey::factory()->create([
            'created_by_user_id' => $staff->id,
            'title' => 'Graduate Tracer Study',
            'description' => 'Questions? Email Zandro Villaflor at zandro@example.com.',
        ]);

        $rendered = json_encode((new SurveyInvitation($survey))->toMail($recipient)->toArray());

        $this->assertStringNotContainsString('zandro@example.com', $rendered);
        $this->assertStringContainsString('Graduate Tracer Study', $rendered);
    }

    public function test_password_reset_link_does_not_carry_the_email_address(): void
    {
        $user = User::factory()->create(['email' => 'zandro@example.com']);

        $link = (new \Illuminate\Auth\Notifications\ResetPassword('test-token'))->toMail($user)->actionUrl;

        $this->assertStringNotContainsString('zandro%40example.com', $link);
        $this->assertStringNotContainsString('zandro@example.com', $link);
        $this->assertStringContainsString('test-token', $link);
    }
}

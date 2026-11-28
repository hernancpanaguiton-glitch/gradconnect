<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A refusal raised with abort(422, '…') (applying twice, a closed job or
 * survey, a full event) must come back to the page as a readable message
 * when the app itself sent the request, not as a bare error page.
 */
class InertiaRefusalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /** Headers of a page load made by the app itself (Inertia checks the asset version on GET). */
    private function inertia(): array
    {
        return ['X-Inertia' => 'true', 'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request())];
    }

    private function openPosting(): JobPosting
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->create(['owner_user_id' => $partner->id]);

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
    }

    public function test_a_refusal_returns_to_the_page_with_its_message(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();
        $posting = $this->openPosting();
        $this->actingAs($alumni)->post(route('applications.store', $posting), []);

        $this->actingAs($alumni)
            ->from(route('jobs.show', $posting))
            ->withHeaders(['X-Inertia' => 'true'])
            ->post(route('applications.store', $posting), [])
            ->assertRedirect(route('jobs.show', $posting))
            ->assertSessionHas('error', 'You have already applied to this position.');
    }

    public function test_a_plain_request_still_gets_the_422_status(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();
        $posting = $this->openPosting();
        $this->actingAs($alumni)->post(route('applications.store', $posting), []);

        $this->actingAs($alumni)->post(route('applications.store', $posting), [])->assertStatus(422);
    }

    public function test_a_refused_application_to_a_closed_job_lands_on_the_dashboard_with_the_reason(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();
        $posting = $this->openPosting();
        $page = route('jobs.show', $posting);
        $posting->update(['status' => 'closed']); // closed while the graduate had the page open

        $this->actingAs($alumni)->from($page)->withHeaders(['X-Inertia' => 'true'])
            ->post(route('applications.store', $posting), [])
            ->assertRedirect($page);

        // That page is gone now, so following the redirect must not show an error screen.
        $this->actingAs($alumni)->withHeaders($this->inertia())->get($page)
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('error', 'This position is no longer accepting applications.');
    }

    public function test_a_refused_answer_to_a_closed_survey_does_not_loop(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['status' => 'closed']);
        $form = route('surveys.respond', $survey);

        $this->actingAs($alumni)->from($form)->withHeaders(['X-Inertia' => 'true'])
            ->post(route('surveys.respond.store', $survey), ['answers' => []])
            ->assertRedirect($form);

        $this->actingAs($alumni)->from($form)->withHeaders($this->inertia())->get($form)
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('error', 'This survey is not currently open.');
    }
}

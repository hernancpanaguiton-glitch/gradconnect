<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\MatchFeedback;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchFeedbackControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makeMatch(): array
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $match = $profile->matchResults()->create(['job_posting_id' => $posting->id, 'fit_score' => 70]);

        return [$alumni, $match];
    }

    public function test_graduate_can_rate_their_own_match_as_helpful(): void
    {
        [$alumni, $match] = $this->makeMatch();

        $this->actingAs($alumni)->post(route('recommendations.feedback', $match), ['rating' => 'helpful'])
            ->assertRedirect();

        $this->assertDatabaseHas('match_feedback', [
            'job_match_result_id' => $match->id, 'user_id' => $alumni->id, 'rating' => 'helpful',
        ]);
    }

    public function test_resubmitting_feedback_updates_rather_than_duplicates(): void
    {
        [$alumni, $match] = $this->makeMatch();

        $this->actingAs($alumni)->post(route('recommendations.feedback', $match), ['rating' => 'helpful']);
        $this->actingAs($alumni)->post(route('recommendations.feedback', $match), ['rating' => 'not_helpful']);

        $this->assertSame(1, MatchFeedback::count());
        $this->assertSame('not_helpful', MatchFeedback::first()->rating);
    }

    public function test_a_different_graduate_cannot_rate_someone_elses_match(): void
    {
        [, $match] = $this->makeMatch();
        $other = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($other, 'user')->create();

        $this->actingAs($other)->post(route('recommendations.feedback', $match), ['rating' => 'helpful'])
            ->assertForbidden();
    }

    public function test_invalid_rating_is_rejected(): void
    {
        [$alumni, $match] = $this->makeMatch();

        $this->actingAs($alumni)->post(route('recommendations.feedback', $match), ['rating' => 'meh'])
            ->assertSessionHasErrors('rating');
    }
}

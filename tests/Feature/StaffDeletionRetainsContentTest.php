<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Event;
use App\Models\LearningResource;
use App\Models\Scholarship;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Institutional records outlive the account that made them.
 *
 * Every "created by" column used to cascade, so removing one retired
 * officer's account deleted their surveys — and because answers cascade from
 * questions, every tracer-study response ever collected went with them.
 */
class StaffDeletionRetainsContentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_deleting_the_creator_keeps_their_content_and_survey_answers(): void
    {
        $officer = User::factory()->alumniAffairs()->create();
        $respondent = User::factory()->alumni()->create();

        $survey = Survey::factory()->create(['created_by_user_id' => $officer->id]);
        $question = SurveyQuestion::factory()->create(['survey_id' => $survey->id]);
        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            'user_id' => $respondent->id,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
        $response->answers()->create(['survey_question_id' => $question->id, 'value' => 'Employed']);

        $announcement = Announcement::factory()->create(['created_by_user_id' => $officer->id]);
        $resource = LearningResource::factory()->create(['created_by_user_id' => $officer->id]);
        $event = Event::factory()->create(['created_by_user_id' => $officer->id]);
        $scholarship = Scholarship::factory()->create(['created_by_user_id' => $officer->id]);

        $officer->delete();

        $this->assertDatabaseHas('surveys', ['id' => $survey->id, 'created_by_user_id' => null]);
        $this->assertDatabaseHas('survey_questions', ['id' => $question->id]);
        $this->assertDatabaseCount('survey_answers', 1);
        $this->assertDatabaseHas('announcements', ['id' => $announcement->id, 'created_by_user_id' => null]);
        $this->assertDatabaseHas('learning_resources', ['id' => $resource->id, 'created_by_user_id' => null]);
        $this->assertDatabaseHas('events', ['id' => $event->id, 'created_by_user_id' => null]);
        $this->assertDatabaseHas('scholarships', ['id' => $scholarship->id, 'created_by_user_id' => null]);
    }

    public function test_pages_still_render_content_whose_creator_is_gone(): void
    {
        $officer = User::factory()->alumniAffairs()->create();
        Event::factory()->create(['created_by_user_id' => $officer->id, 'status' => 'published']);
        Announcement::factory()->create(['created_by_user_id' => $officer->id]);

        $officer->delete();

        $this->actingAs(User::factory()->alumni()->create())
            ->get(route('events'))
            ->assertOk();

        // The announcements list is staff-only, and it renders the creator.
        $this->actingAs(User::factory()->alumniAffairs()->create())
            ->get(route('announcements.index'))
            ->assertOk();
    }
}

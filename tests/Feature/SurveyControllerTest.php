<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SurveyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    // ─── Listing ─────────────────────────────────────────────────────────────

    public function test_alumni_affairs_can_list_all_surveys(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        Survey::factory()->for($staff, 'createdBy')->count(2)->create(['status' => 'draft']);
        Survey::factory()->for($staff, 'createdBy')->count(1)->create(['status' => 'open']);

        $response = $this->actingAs($staff)->get('/surveys');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Surveys/Index')
                ->has('surveys', 3)
                ->where('canManage', true)
            );
    }

    public function test_alumni_see_only_open_surveys(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        Survey::factory()->for($staff, 'createdBy')->create(['status' => 'draft']);
        Survey::factory()->for($staff, 'createdBy')->create(['status' => 'open']);

        $response = $this->actingAs($alumni)->get('/surveys');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('surveys', 1)
                ->where('canManage', false)
            );
    }

    // ─── Create / store ──────────────────────────────────────────────────────

    public function test_alumni_affairs_can_create_a_survey(): void
    {
        $staff = User::factory()->alumniAffairs()->create();

        $response = $this->actingAs($staff)
            ->post('/surveys', [
                'title' => 'Employability 2025',
                'type' => 'employability',
                'status' => 'open',
                'questions' => [
                    ['prompt' => 'Are you employed?', 'type' => 'boolean', 'is_required' => true],
                ],
            ]);

        $response->assertRedirect('/surveys');

        $this->assertDatabaseHas('surveys', ['title' => 'Employability 2025']);
        $this->assertDatabaseHas('survey_questions', ['prompt' => 'Are you employed?']);
    }

    public function test_alumni_cannot_create_a_survey(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post('/surveys', ['title' => 'Hack', 'type' => 'custom', 'status' => 'open'])
            ->assertStatus(403);

        $this->assertDatabaseMissing('surveys', ['title' => 'Hack']);
    }

    public function test_survey_title_is_required(): void
    {
        $staff = User::factory()->alumniAffairs()->create();

        $this->actingAs($staff)
            ->post('/surveys', ['type' => 'custom', 'status' => 'open'])
            ->assertSessionHasErrors('title');
    }

    // ─── Edit / update ───────────────────────────────────────────────────────

    public function test_alumni_affairs_can_update_a_survey(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['title' => 'Old Title']);

        $this->actingAs($staff)
            ->patch("/surveys/{$survey->id}", [
                'title' => 'New Title',
                'type' => 'custom',
                'status' => 'open',
                'questions' => [],
            ])
            ->assertRedirect();

        $this->assertSame('New Title', $survey->fresh()->title);
    }

    public function test_alumni_cannot_update_a_survey(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create();

        $this->actingAs($alumni)
            ->patch("/surveys/{$survey->id}", [
                'title' => 'Hacked',
                'type' => 'custom',
                'status' => 'open',
                'questions' => [],
            ])
            ->assertStatus(403);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    public function test_alumni_affairs_can_delete_a_survey(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create();

        $this->actingAs($staff)
            ->delete("/surveys/{$survey->id}")
            ->assertRedirect('/surveys');

        $this->assertDatabaseMissing('surveys', ['id' => $survey->id]);
    }

    // ─── Results ─────────────────────────────────────────────────────────────

    public function test_alumni_affairs_can_view_survey_results(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create();

        $this->actingAs($staff)
            ->get("/surveys/{$survey->id}/results")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Surveys/Results'));
    }

    public function test_alumni_cannot_view_survey_results(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create();

        $this->actingAs($alumni)
            ->get("/surveys/{$survey->id}/results")
            ->assertStatus(403);
    }

    // ─── Respond ─────────────────────────────────────────────────────────────

    public function test_alumni_can_submit_a_survey_response(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create([
            'status' => 'open',
            'opens_at' => now()->subDay(),
            'closes_at' => now()->addDay(),
        ]);
        $question = SurveyQuestion::factory()->for($survey)->create([
            'prompt' => 'Are you employed?',
            'type' => 'boolean',
            'order' => 1,
        ]);

        $this->actingAs($alumni)
            ->post("/surveys/{$survey->id}/respond", [
                'answers' => [$question->id => 'Yes'],
            ])
            ->assertRedirect('/surveys');

        $this->assertDatabaseHas('survey_responses', [
            'survey_id' => $survey->id,
            'user_id' => $alumni->id,
            'status' => 'submitted',
        ]);
    }

    public function test_closed_survey_returns_error(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $survey = Survey::factory()->for($staff, 'createdBy')->create([
            'status' => 'closed',
        ]);

        $this->actingAs($alumni)
            ->post("/surveys/{$survey->id}/respond", ['answers' => []])
            ->assertStatus(422);
    }
}

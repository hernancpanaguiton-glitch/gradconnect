<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CareerReadinessControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makeReadinessSurvey(User $staff): Survey
    {
        $survey = Survey::factory()->for($staff, 'createdBy')->create(['type' => 'readiness', 'status' => 'open']);
        SurveyQuestion::factory()->for($survey)->rating()->create();
        SurveyQuestion::factory()->for($survey)->rating()->create();

        return $survey;
    }

    private function submit(Survey $survey, User $user, array $ratings): void
    {
        $questions = $survey->questions()->orderBy('id')->get();
        $answers = [];
        foreach ($questions as $i => $question) {
            $answers[$question->id] = $ratings[$i];
        }

        $this->actingAs($user)->post("/surveys/{$survey->id}/respond", ['answers' => $answers]);
    }

    public function test_student_with_no_submission_sees_prompt_to_take_open_assessment(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $student = User::factory()->student()->create();
        $survey = $this->makeReadinessSurvey($staff);

        $this->actingAs($student)->get(route('career-readiness'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('CareerReadiness')
                ->where('mode', 'personal')
                ->where('hasResult', false)
                ->where('openSurvey.id', $survey->id)
            );
    }

    public function test_student_sees_their_score_and_band_after_submitting(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $student = User::factory()->student()->create();
        $survey = $this->makeReadinessSurvey($staff);

        // 5 + 5 out of 10 max => 100%.
        $this->submit($survey, $student, [5, 5]);

        $this->actingAs($student)->get(route('career-readiness'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasResult', true)
                ->where('score', 100)
                ->where('band', 'Career Ready')
            );
    }

    public function test_low_ratings_produce_needs_improvement_band(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $student = User::factory()->student()->create();
        $survey = $this->makeReadinessSurvey($staff);

        // 1 + 1 out of 10 max => 20%.
        $this->submit($survey, $student, [1, 1]);

        $this->actingAs($student)->get(route('career-readiness'))
            ->assertInertia(fn ($page) => $page->where('score', 20)->where('band', 'Needs Improvement'));
    }

    public function test_sao_sees_aggregate_distribution_across_respondents(): void
    {
        $staff = User::factory()->alumniAffairs()->create();
        $sao = User::factory()->sao()->create();
        $survey = $this->makeReadinessSurvey($staff);

        $ready = User::factory()->student()->create();
        $developing = User::factory()->student()->create();
        $this->submit($survey, $ready, [5, 5]); // 100% -> Career Ready
        $this->submit($survey, $developing, [3, 3]); // 60% -> Developing

        $this->actingAs($sao)->get(route('career-readiness'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('mode', 'aggregate')
                ->where('totalRespondents', 2)
                ->where('averageScore', 80)
                ->where('distribution.Career Ready', 1)
                ->where('distribution.Developing', 1)
                ->where('distribution.Needs Improvement', 0)
            );
    }

    public function test_industry_partner_cannot_access_career_readiness(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('career-readiness'))->assertForbidden();
    }
}

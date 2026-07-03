<?php

namespace Tests\Feature;

use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SkillSuggestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function fakeGroq(array $json): void
    {
        config(['services.groq.api_key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['content' => json_encode($json)]]],
            ]),
        ]);
    }

    public function test_suggest_merges_library_and_ai_results(): void
    {
        Skill::findOrCreateByName('Java');
        $this->fakeGroq(['skills' => ['JavaScript', 'Java Spring']]);

        $user = User::factory()->alumni()->create();

        $response = $this->actingAs($user)->getJson(route('skills.suggest', ['q' => 'Java']));

        $response->assertOk();
        $names = collect($response->json('suggestions'))->pluck('name');
        $this->assertContains('Java', $names);        // library
        $this->assertContains('JavaScript', $names);  // AI
    }

    public function test_store_valid_skill_creates_and_attaches(): void
    {
        $this->fakeGroq(['valid' => true, 'canonical' => 'Kubernetes']);
        $user = User::factory()->alumni()->create();

        $response = $this->actingAs($user)->postJson(route('skills.store'), ['name' => 'kubernetes']);

        $response->assertOk()->assertJsonPath('skill.name', 'Kubernetes');

        $skill = Skill::firstWhere('name', 'Kubernetes');
        $this->assertNotNull($skill);
        $this->assertDatabaseHas('graduate_skill', [
            'graduate_profile_id' => $user->graduateProfile->id,
            'skill_id' => $skill->id,
            'source' => 'self',
        ]);
    }

    public function test_store_rejects_illegitimate_skill(): void
    {
        $this->fakeGroq(['valid' => false]);
        $user = User::factory()->alumni()->create();

        $this->actingAs($user)
            ->postJson(route('skills.store'), ['name' => 'asdfqwerty'])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name');

        $this->assertDatabaseMissing('skills', ['name' => 'asdfqwerty']);
    }

    public function test_works_without_ai_provider(): void
    {
        // No API keys configured (default test env).
        Skill::findOrCreateByName('Python');
        $user = User::factory()->alumni()->create();

        // suggest still returns library matches...
        $suggest = $this->actingAs($user)->getJson(route('skills.suggest', ['q' => 'Pyth']));
        $suggest->assertOk();
        $this->assertContains('Python', collect($suggest->json('suggestions'))->pluck('name'));

        // ...and store accepts the typed name as-is.
        $this->actingAs($user)
            ->postJson(route('skills.store'), ['name' => 'rust'])
            ->assertOk()->assertJsonPath('skill.name', 'Rust');
    }
}

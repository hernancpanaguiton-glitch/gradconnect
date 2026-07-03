<?php

namespace Tests\Feature;

use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class JobAssistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function partner(): User
    {
        return User::factory()->industryPartner()->create();
    }

    private function fakeGroqText(string $text): void
    {
        config(['services.groq.api_key' => 'test-key']);
        Http::fake([
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => $text]]]]),
        ]);
    }

    private function fakeGroqJson(array $json): void
    {
        config(['services.groq.api_key' => 'test-key']);
        Http::fake([
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode($json)]]]]),
        ]);
    }

    public function test_title_suggestions(): void
    {
        $this->fakeGroqJson(['titles' => ['Backend Developer', 'Backend Engineer']]);

        $response = $this->actingAs($this->partner())
            ->getJson(route('postings.assist.titles', ['q' => 'back']));

        $response->assertOk();
        $this->assertContains('Backend Developer', $response->json('titles'));
    }

    public function test_generate_description(): void
    {
        $this->fakeGroqText('We are seeking a backend developer to build and maintain APIs.');

        $this->actingAs($this->partner())
            ->postJson(route('postings.assist.description'), ['title' => 'Backend Developer'])
            ->assertOk()
            ->assertJsonPath('text', 'We are seeking a backend developer to build and maintain APIs.');
    }

    public function test_generate_qualifications(): void
    {
        $this->fakeGroqText("- BS in Computer Science\n- 3 years with Laravel");

        $this->actingAs($this->partner())
            ->postJson(route('postings.assist.qualifications'), ['title' => 'Backend Developer'])
            ->assertOk()
            ->assertJsonPath('text', "- BS in Computer Science\n- 3 years with Laravel");
    }

    public function test_description_requires_title(): void
    {
        $this->actingAs($this->partner())
            ->postJson(route('postings.assist.description'), [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('title');
    }

    public function test_generation_unavailable_without_ai_key(): void
    {
        // Force "no provider" regardless of the developer's environment.
        config(['services.groq.api_key' => null, 'services.gemini.api_key' => null]);
        Http::preventStrayRequests();

        $this->actingAs($this->partner())
            ->postJson(route('postings.assist.description'), ['title' => 'Backend Developer'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'AI generation is unavailable. Add the Gemini or Groq API key to enable it.');
    }

    public function test_resolve_creates_skill_without_attaching(): void
    {
        $this->fakeGroqJson(['valid' => true, 'canonical' => 'Rust']);

        $this->actingAs($this->partner())
            ->postJson(route('skills.resolve'), ['name' => 'rust'])
            ->assertOk()
            ->assertJsonPath('skill.name', 'Rust');

        $this->assertNotNull(Skill::firstWhere('name', 'Rust'));
        $this->assertDatabaseCount('graduate_skill', 0);
    }

    public function test_resolve_rejects_illegitimate_skill(): void
    {
        $this->fakeGroqJson(['valid' => false]);

        $this->actingAs($this->partner())
            ->postJson(route('skills.resolve'), ['name' => 'zxcvbnm'])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name');
    }
}

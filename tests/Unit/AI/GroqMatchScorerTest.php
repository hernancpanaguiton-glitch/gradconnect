<?php

namespace Tests\Unit\AI;

use App\AI\Providers\GroqMatchScorer;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GroqMatchScorerTest extends TestCase
{
    public function test_it_returns_null_when_api_key_is_missing(): void
    {
        config(['services.groq.api_key' => null]);

        $scorer = new GroqMatchScorer;

        $this->assertNull($scorer->score('resume', 'job'));
    }

    public function test_it_parses_a_valid_json_response(): void
    {
        config(['services.groq.api_key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode([
                        'fit_score' => 82,
                        'recommendation' => 'strong',
                        'explanation' => 'Good overlap in backend skills.',
                        'skill_gaps' => ['Kubernetes'],
                        'matched_skills' => ['PHP', 'Laravel'],
                    ])]],
                ],
            ], 200),
        ]);

        $result = (new GroqMatchScorer)->score('resume text', 'job text');

        $this->assertNotNull($result);
        $this->assertSame(82, $result->fitScore);
        $this->assertSame('strong', $result->recommendation);
        $this->assertSame(['Kubernetes'], $result->skillGaps);
        $this->assertSame(['PHP', 'Laravel'], $result->matchedSkills);
        $this->assertSame('groq', $result->provider);
    }

    public function test_it_strips_markdown_fences_before_parsing(): void
    {
        config(['services.groq.api_key' => 'test-key']);

        $fenced = "```json\n".json_encode(['fit_score' => 50, 'recommendation' => 'moderate', 'explanation' => 'ok', 'skill_gaps' => [], 'matched_skills' => []])."\n```";

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['content' => $fenced]]],
            ], 200),
        ]);

        $result = (new GroqMatchScorer)->score('resume text', 'job text');

        $this->assertNotNull($result);
        $this->assertSame(50, $result->fitScore);
    }

    public function test_it_returns_null_for_malformed_json(): void
    {
        config(['services.groq.api_key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['content' => 'not json at all']]],
            ], 200),
        ]);

        $this->assertNull((new GroqMatchScorer)->score('resume text', 'job text'));
    }

    public function test_it_returns_null_on_a_failed_response(): void
    {
        config(['services.groq.api_key' => 'test-key']);

        Http::fake([
            'api.groq.com/*' => Http::response([], 500),
        ]);

        $this->assertNull((new GroqMatchScorer)->score('resume text', 'job text'));
    }
}

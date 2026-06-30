<?php

namespace Tests\Unit\AI;

use App\AI\Providers\GeminiMatchScorer;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiMatchScorerTest extends TestCase
{
    public function test_it_returns_null_when_api_key_is_missing(): void
    {
        config(['services.gemini.api_key' => null]);

        $this->assertNull((new GeminiMatchScorer)->score('resume', 'job'));
    }

    public function test_it_parses_a_valid_json_response(): void
    {
        config(['services.gemini.api_key' => 'test-key']);

        Http::fake([
            '*generateContent*' => Http::response([
                'candidates' => [
                    ['content' => ['parts' => [['text' => json_encode([
                        'fit_score' => 60,
                        'recommendation' => 'moderate',
                        'explanation' => 'Partial overlap.',
                        'skill_gaps' => ['AWS'],
                        'matched_skills' => ['SQL'],
                    ])]]]],
                ],
            ], 200),
        ]);

        $result = (new GeminiMatchScorer)->score('resume text', 'job text');

        $this->assertNotNull($result);
        $this->assertSame(60, $result->fitScore);
        $this->assertSame('gemini', $result->provider);
    }

    public function test_it_returns_null_on_a_failed_response(): void
    {
        config(['services.gemini.api_key' => 'test-key']);

        Http::fake([
            '*generateContent*' => Http::response([], 500),
        ]);

        $this->assertNull((new GeminiMatchScorer)->score('resume text', 'job text'));
    }
}

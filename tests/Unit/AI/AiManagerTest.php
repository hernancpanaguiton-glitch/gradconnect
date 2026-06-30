<?php

namespace Tests\Unit\AI;

use App\AI\AiManager;
use App\AI\Contracts\MatchScorer;
use App\AI\DTO\MatchResult;
use App\AI\Providers\GeminiMatchScorer;
use App\AI\Providers\GroqMatchScorer;
use Tests\TestCase;

class AiManagerTest extends TestCase
{
    public function test_scoring_uses_the_primary_provider_when_it_succeeds(): void
    {
        config(['ai.scoring.default' => 'groq', 'ai.scoring.fallback' => 'gemini']);

        $primaryResult = new MatchResult(90, 'strong', 'great fit', [], ['PHP'], 'groq');

        $primary = $this->createMock(MatchScorer::class);
        $primary->method('score')->willReturn($primaryResult);

        $fallback = $this->createMock(MatchScorer::class);
        $fallback->expects($this->never())->method('score');

        $this->app->instance(GroqMatchScorer::class, $primary);
        $this->app->instance(GeminiMatchScorer::class, $fallback);

        $result = (new AiManager)->scoreWithFallback('resume', 'job');

        $this->assertSame($primaryResult, $result);
    }

    public function test_scoring_falls_back_when_the_primary_provider_returns_null(): void
    {
        config(['ai.scoring.default' => 'groq', 'ai.scoring.fallback' => 'gemini']);

        $fallbackResult = new MatchResult(40, 'weak', 'partial fit', ['AWS'], [], 'gemini');

        $primary = $this->createMock(MatchScorer::class);
        $primary->method('score')->willReturn(null);

        $fallback = $this->createMock(MatchScorer::class);
        $fallback->method('score')->willReturn($fallbackResult);

        $this->app->instance(GroqMatchScorer::class, $primary);
        $this->app->instance(GeminiMatchScorer::class, $fallback);

        $result = (new AiManager)->scoreWithFallback('resume', 'job');

        $this->assertSame($fallbackResult, $result);
    }

    public function test_scoring_falls_back_when_the_primary_provider_throws(): void
    {
        config(['ai.scoring.default' => 'groq', 'ai.scoring.fallback' => 'gemini']);

        $fallbackResult = new MatchResult(40, 'weak', 'partial fit', ['AWS'], [], 'gemini');

        $primary = $this->createMock(MatchScorer::class);
        $primary->method('score')->willThrowException(new \RuntimeException('boom'));

        $fallback = $this->createMock(MatchScorer::class);
        $fallback->method('score')->willReturn($fallbackResult);

        $this->app->instance(GroqMatchScorer::class, $primary);
        $this->app->instance(GeminiMatchScorer::class, $fallback);

        $result = (new AiManager)->scoreWithFallback('resume', 'job');

        $this->assertSame($fallbackResult, $result);
    }

    public function test_scoring_returns_null_when_both_providers_fail(): void
    {
        config(['ai.scoring.default' => 'groq', 'ai.scoring.fallback' => 'gemini']);

        $primary = $this->createMock(MatchScorer::class);
        $primary->method('score')->willReturn(null);

        $fallback = $this->createMock(MatchScorer::class);
        $fallback->method('score')->willReturn(null);

        $this->app->instance(GroqMatchScorer::class, $primary);
        $this->app->instance(GeminiMatchScorer::class, $fallback);

        $this->assertNull((new AiManager)->scoreWithFallback('resume', 'job'));
    }

    public function test_resolving_an_unknown_provider_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new AiManager)->scorer('does-not-exist');
    }
}

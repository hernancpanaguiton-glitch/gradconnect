<?php

namespace App\AI;

use App\AI\Contracts\EmbeddingProvider;
use App\AI\Contracts\MatchScorer;
use App\AI\DTO\MatchResult;
use App\AI\Providers\GeminiEmbeddingProvider;
use App\AI\Providers\GeminiMatchScorer;
use App\AI\Providers\GroqMatchScorer;
use App\AI\Providers\JinaEmbeddingProvider;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class AiManager
{
    /**
     * @var array<string, class-string<EmbeddingProvider>>
     */
    protected array $embeddingProviders = [
        'gemini' => GeminiEmbeddingProvider::class,
        'jina' => JinaEmbeddingProvider::class,
    ];

    /**
     * @var array<string, class-string<MatchScorer>>
     */
    protected array $scorerProviders = [
        'groq' => GroqMatchScorer::class,
        'gemini' => GeminiMatchScorer::class,
    ];

    public function embeddingProvider(?string $name = null): EmbeddingProvider
    {
        return $this->resolve('embedding', $name ?? config('ai.embeddings.default'));
    }

    public function scorer(string $name): MatchScorer
    {
        return $this->resolve('scorer', $name);
    }

    /**
     * Score a resume against a job, trying the primary scorer first and
     * falling back to the configured fallback provider on failure.
     *
     * @param  array<string, mixed>  $context
     */
    public function scoreWithFallback(string $resumeText, string $jobText, array $context = []): ?MatchResult
    {
        $primary = config('ai.scoring.default');
        $fallback = config('ai.scoring.fallback');

        $result = $this->tryScorer($primary, $resumeText, $jobText, $context);

        if ($result !== null) {
            return $result;
        }

        if ($fallback && $fallback !== $primary) {
            return $this->tryScorer($fallback, $resumeText, $jobText, $context);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    protected function tryScorer(string $name, string $resumeText, string $jobText, array $context): ?MatchResult
    {
        try {
            return $this->scorer($name)->score($resumeText, $jobText, $context);
        } catch (\Throwable $e) {
            Log::warning("AI scoring provider [{$name}] failed", ['exception' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Resolve a provider instance from the container.
     *
     * Kept as a single seam so tests can mock provider resolution without
     * touching the public API.
     */
    protected function resolve(string $type, string $name): EmbeddingProvider|MatchScorer
    {
        $map = $type === 'embedding' ? $this->embeddingProviders : $this->scorerProviders;

        $class = $map[$name] ?? null;

        if ($class === null) {
            throw new InvalidArgumentException("Unknown AI {$type} provider [{$name}].");
        }

        return app($class);
    }
}

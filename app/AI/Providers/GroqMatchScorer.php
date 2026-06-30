<?php

namespace App\AI\Providers;

use App\AI\Contracts\MatchScorer;
use App\AI\DTO\MatchResult;
use App\AI\Providers\Concerns\BuildsMatchPrompt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqMatchScorer implements MatchScorer
{
    use BuildsMatchPrompt;

    public function score(string $resumeText, string $jobText, array $context = []): ?MatchResult
    {
        $apiKey = config('services.groq.api_key');

        if (! $apiKey) {
            return null;
        }

        try {
            $response = Http::withToken($apiKey)
                ->post(config('services.groq.api_url'), [
                    'model' => config('services.groq.model'),
                    'messages' => [
                        ['role' => 'user', 'content' => $this->buildPrompt($resumeText, $jobText, $context)],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.2,
                ]);

            if (! $response->successful()) {
                Log::warning('Groq match scoring request failed', ['status' => $response->status()]);

                return null;
            }

            return $this->parseJsonResponse($response->json('choices.0.message.content'), 'groq');
        } catch (\Throwable $e) {
            Log::warning('Groq match scoring request threw', ['exception' => $e->getMessage()]);

            return null;
        }
    }
}

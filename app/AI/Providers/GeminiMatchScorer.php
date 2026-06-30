<?php

namespace App\AI\Providers;

use App\AI\Contracts\MatchScorer;
use App\AI\DTO\MatchResult;
use App\AI\Providers\Concerns\BuildsMatchPrompt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiMatchScorer implements MatchScorer
{
    use BuildsMatchPrompt;

    public function score(string $resumeText, string $jobText, array $context = []): ?MatchResult
    {
        $apiKey = config('services.gemini.api_key');

        if (! $apiKey) {
            return null;
        }

        $model = config('services.gemini.chat_model');
        $url = config('services.gemini.chat_url')."/{$model}:generateContent";

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->post($url, [
                    'contents' => [
                        ['parts' => [['text' => $this->buildPrompt($resumeText, $jobText, $context)]]],
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.2,
                    ],
                ]);

            if (! $response->successful()) {
                Log::warning('Gemini match scoring request failed', ['status' => $response->status()]);

                return null;
            }

            return $this->parseJsonResponse($response->json('candidates.0.content.parts.0.text'), 'gemini');
        } catch (\Throwable $e) {
            Log::warning('Gemini match scoring request threw', ['exception' => $e->getMessage()]);

            return null;
        }
    }
}

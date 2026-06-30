<?php

namespace App\AI\Providers;

use App\AI\Contracts\EmbeddingProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiEmbeddingProvider implements EmbeddingProvider
{
    public function embed(string $text): ?array
    {
        $apiKey = config('services.gemini.api_key');

        if (! $apiKey) {
            return null;
        }

        $model = config('services.gemini.embedding_model');
        $url = config('services.gemini.embedding_url')."/{$model}:embedContent";

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->post($url, [
                    'content' => ['parts' => [['text' => $text]]],
                    'outputDimensionality' => $this->dimension(),
                ]);

            if (! $response->successful()) {
                Log::warning('Gemini embedding request failed', ['status' => $response->status()]);

                return null;
            }

            $values = $response->json('embedding.values');

            return is_array($values) ? array_map(floatval(...), $values) : null;
        } catch (\Throwable $e) {
            Log::warning('Gemini embedding request threw', ['exception' => $e->getMessage()]);

            return null;
        }
    }

    public function dimension(): int
    {
        return (int) config('ai.embeddings.dimension', 768);
    }
}

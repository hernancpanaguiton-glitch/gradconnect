<?php

namespace App\AI\Providers;

use App\AI\Contracts\EmbeddingProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JinaEmbeddingProvider implements EmbeddingProvider
{
    public function embed(string $text): ?array
    {
        $apiKey = config('services.jina.api_key');

        if (! $apiKey) {
            return null;
        }

        try {
            $response = Http::withToken($apiKey)
                ->post(config('services.jina.api_url'), [
                    'model' => config('services.jina.model'),
                    'input' => [$text],
                    'dimensions' => $this->dimension(),
                ]);

            if (! $response->successful()) {
                Log::warning('Jina embedding request failed', ['status' => $response->status()]);

                return null;
            }

            $values = $response->json('data.0.embedding');

            return is_array($values) ? array_map(floatval(...), $values) : null;
        } catch (\Throwable $e) {
            Log::warning('Jina embedding request threw', ['exception' => $e->getMessage()]);

            return null;
        }
    }

    public function dimension(): int
    {
        return (int) config('ai.embeddings.dimension', 768);
    }
}

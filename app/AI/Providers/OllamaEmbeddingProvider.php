<?php

namespace App\AI\Providers;

use App\AI\Contracts\EmbeddingProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Embeddings from a self-hosted Ollama server, so résumé text never leaves
 * the machine. The default model, nomic-embed-text, makes 768-number
 * vectors, which fit the existing vector(768) columns.
 */
class OllamaEmbeddingProvider implements EmbeddingProvider
{
    public function embed(string $text): ?array
    {
        try {
            $response = Http::connectTimeout((int) config('ai.http.connect_timeout'))
                ->timeout((int) config('ai.http.timeout'))
                ->post(rtrim((string) config('services.ollama.url'), '/').'/api/embed', [
                    'model' => config('services.ollama.embedding_model'),
                    // nomic-embed-text expects a task prefix on every input.
                    'input' => config('services.ollama.embedding_prefix').$text,
                ]);

            if (! $response->successful()) {
                Log::warning('Ollama embedding request failed', ['status' => $response->status()]);

                return null;
            }

            $values = $response->json('embeddings.0');

            if (! is_array($values) || count($values) !== $this->dimension()) {
                // Another model's vector would not fit the database column.
                Log::warning('Ollama embedding has the wrong size', [
                    'expected' => $this->dimension(),
                    'got' => is_array($values) ? count($values) : null,
                ]);

                return null;
            }

            return array_map(floatval(...), $values);
        } catch (\Throwable $e) {
            Log::warning('Ollama embedding request threw', ['exception' => $e::class]);

            return null;
        }
    }

    public function dimension(): int
    {
        return (int) config('ai.embeddings.dimension', 768);
    }
}

<?php

namespace Tests\Unit\AI;

use App\AI\Providers\GeminiEmbeddingProvider;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiEmbeddingProviderTest extends TestCase
{
    public function test_it_returns_null_when_api_key_is_missing(): void
    {
        config(['services.gemini.api_key' => null]);

        $provider = new GeminiEmbeddingProvider;

        $this->assertNull($provider->embed('some resume text'));
    }

    public function test_it_returns_a_vector_of_the_configured_dimension(): void
    {
        config(['services.gemini.api_key' => 'test-key', 'ai.embeddings.dimension' => 3]);

        Http::fake([
            '*embedContent*' => Http::response([
                'embedding' => ['values' => [0.1, 0.2, 0.3]],
            ], 200),
        ]);

        $provider = new GeminiEmbeddingProvider;
        $vector = $provider->embed('some resume text');

        $this->assertSame([0.1, 0.2, 0.3], $vector);
        $this->assertSame(3, $provider->dimension());
    }

    public function test_it_returns_null_on_a_failed_response(): void
    {
        config(['services.gemini.api_key' => 'test-key']);

        Http::fake([
            '*embedContent*' => Http::response([], 500),
        ]);

        $provider = new GeminiEmbeddingProvider;

        $this->assertNull($provider->embed('some resume text'));
    }
}

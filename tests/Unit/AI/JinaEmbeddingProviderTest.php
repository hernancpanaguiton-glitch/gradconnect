<?php

namespace Tests\Unit\AI;

use App\AI\Providers\JinaEmbeddingProvider;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class JinaEmbeddingProviderTest extends TestCase
{
    public function test_it_returns_null_when_api_key_is_missing(): void
    {
        config(['services.jina.api_key' => null]);

        $provider = new JinaEmbeddingProvider;

        $this->assertNull($provider->embed('some resume text'));
    }

    public function test_it_returns_a_vector_from_the_response(): void
    {
        config(['services.jina.api_key' => 'test-key']);

        Http::fake([
            '*api.jina.ai*' => Http::response([
                'data' => [['embedding' => [0.5, 0.6]]],
            ], 200),
        ]);

        $provider = new JinaEmbeddingProvider;

        $this->assertSame([0.5, 0.6], $provider->embed('some resume text'));
    }
}

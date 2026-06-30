<?php

namespace Tests\Unit\Services;

use App\AI\AiManager;
use App\AI\Contracts\EmbeddingProvider;
use App\AI\Providers\GeminiEmbeddingProvider;
use App\Services\EmbeddingService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EmbeddingServiceTest extends TestCase
{
    public function test_it_embeds_text_using_the_configured_provider(): void
    {
        config(['ai.embeddings.default' => 'gemini', 'ai.embeddings.dimension' => 4, 'services.gemini.api_key' => 'test-key']);

        Http::fake([
            '*embedContent*' => Http::response([
                'embedding' => ['values' => [0.1, 0.2, 0.3, 0.4]],
            ], 200),
        ]);

        $service = new EmbeddingService(new AiManager);

        $vector = $service->embed('resume text');

        $this->assertSame([0.1, 0.2, 0.3, 0.4], $vector);
        $this->assertSame(4, $service->dimension());
    }

    public function test_it_returns_null_without_an_api_key(): void
    {
        config(['ai.embeddings.default' => 'gemini', 'services.gemini.api_key' => null]);

        $service = new EmbeddingService(new AiManager);

        $this->assertNull($service->embed('resume text'));
    }

    public function test_it_delegates_to_the_provider_resolved_from_the_container(): void
    {
        config(['ai.embeddings.default' => 'gemini']);

        $provider = $this->createMock(EmbeddingProvider::class);
        $provider->method('embed')->willReturn([1.0, 2.0]);
        $provider->method('dimension')->willReturn(2);

        $this->app->instance(GeminiEmbeddingProvider::class, $provider);

        $service = new EmbeddingService(new AiManager);

        $this->assertSame([1.0, 2.0], $service->embed('resume text'));
        $this->assertSame(2, $service->dimension());
    }
}

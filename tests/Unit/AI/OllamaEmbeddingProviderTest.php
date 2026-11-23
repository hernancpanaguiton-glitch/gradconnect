<?php

namespace Tests\Unit\AI;

use App\AI\AiManager;
use App\AI\Providers\OllamaEmbeddingProvider;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OllamaEmbeddingProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'ai.embeddings.dimension' => 3,
            'services.ollama.url' => 'http://ollama:11434',
            'services.ollama.embedding_model' => 'nomic-embed-text',
            'services.ollama.embedding_prefix' => 'search_document: ',
        ]);
    }

    public function test_it_embeds_through_the_local_ollama_server_with_the_model_prefix(): void
    {
        Http::fake(['http://ollama:11434/api/embed' => Http::response(['embeddings' => [[0.1, 0.2, 0.3]]])]);

        $this->assertSame([0.1, 0.2, 0.3], (new OllamaEmbeddingProvider)->embed('Laravel developer'));

        Http::assertSent(fn (Request $r) => $r->url() === 'http://ollama:11434/api/embed'
            && $r['model'] === 'nomic-embed-text'
            && $r['input'] === 'search_document: Laravel developer'
            && ! $r->hasHeader('Authorization'));
    }

    public function test_a_vector_of_the_wrong_size_is_refused_rather_than_stored(): void
    {
        // A different model (e.g. 1024 numbers) would not fit the vector(768) column.
        Http::fake(['*' => Http::response(['embeddings' => [[0.1, 0.2]]])]);

        $this->assertNull((new OllamaEmbeddingProvider)->embed('text'));
    }

    public function test_an_unreachable_or_failing_server_returns_null(): void
    {
        Http::fake(['*' => Http::response('model not found', 404)]);
        $this->assertNull((new OllamaEmbeddingProvider)->embed('text'));

        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('refused'));
        $this->assertNull((new OllamaEmbeddingProvider)->embed('text'));
    }

    public function test_the_manager_offers_ollama_as_an_embedding_provider(): void
    {
        config(['ai.embeddings.default' => 'ollama']);

        $this->assertInstanceOf(OllamaEmbeddingProvider::class, app(AiManager::class)->embeddingProvider());
    }
}

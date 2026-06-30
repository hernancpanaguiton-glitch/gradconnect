<?php

namespace App\Services;

use App\AI\AiManager;

class EmbeddingService
{
    public function __construct(protected AiManager $aiManager) {}

    /**
     * Embed the given text using the configured embedding provider.
     *
     * @return array<int, float>|null
     */
    public function embed(string $text): ?array
    {
        return $this->aiManager->embeddingProvider()->embed($text);
    }

    public function dimension(): int
    {
        return $this->aiManager->embeddingProvider()->dimension();
    }
}

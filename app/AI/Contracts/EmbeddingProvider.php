<?php

namespace App\AI\Contracts;

interface EmbeddingProvider
{
    /**
     * Embed the given text, returning a float vector or null on failure.
     *
     * @return array<int, float>|null
     */
    public function embed(string $text): ?array;

    /**
     * The dimension of vectors produced by this provider.
     */
    public function dimension(): int;
}

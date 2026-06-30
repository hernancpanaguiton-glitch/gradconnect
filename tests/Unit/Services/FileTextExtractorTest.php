<?php

namespace Tests\Unit\Services;

use App\Services\FileTextExtractor;
use Tests\TestCase;

class FileTextExtractorTest extends TestCase
{
    public function test_it_returns_null_for_a_missing_or_unparsable_file(): void
    {
        $extractor = new FileTextExtractor;

        $this->assertNull($extractor->extract('/path/does/not/exist.pdf'));
    }
}

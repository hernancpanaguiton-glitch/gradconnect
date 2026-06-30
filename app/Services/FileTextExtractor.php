<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class FileTextExtractor
{
    /**
     * Maximum number of characters of extracted text to keep, to bound
     * embedding/LLM payload size and avoid leaking excessive resume PII.
     */
    private const MAX_CHARS = 8000;

    /**
     * Extract plain text from a PDF file, truncated to a safe length.
     * Returns null if the file cannot be parsed.
     */
    public function extract(string $absolutePath): ?string
    {
        try {
            $pdf = (new Parser)->parseFile($absolutePath);

            $text = trim($pdf->getText());

            if ($text === '') {
                return null;
            }

            return mb_substr($text, 0, self::MAX_CHARS);
        } catch (\Throwable $e) {
            Log::warning('Failed to extract text from PDF', [
                'path' => $absolutePath,
                'exception' => $e->getMessage(),
            ]);

            return null;
        }
    }
}

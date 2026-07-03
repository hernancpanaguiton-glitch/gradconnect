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
     * Extract plain text from a supported résumé file (PDF, DOCX, or TXT),
     * truncated to a safe length. Returns null if the file cannot be parsed
     * or yields no text.
     */
    public function extract(string $absolutePath): ?string
    {
        $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        try {
            $text = match ($extension) {
                'pdf' => $this->fromPdf($absolutePath),
                'docx' => $this->fromDocx($absolutePath),
                'txt' => $this->fromPlainText($absolutePath),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::warning('Failed to extract text from resume', [
                'path' => $absolutePath,
                'extension' => $extension,
                'exception' => $e->getMessage(),
            ]);

            return null;
        }

        $text = $text !== null ? trim($text) : '';

        if ($text === '') {
            return null;
        }

        return mb_substr($text, 0, self::MAX_CHARS);
    }

    private function fromPdf(string $absolutePath): string
    {
        return (new Parser)->parseFile($absolutePath)->getText();
    }

    /**
     * Read the main document body of a .docx (an OOXML zip), stripping the
     * XML markup down to readable text. Paragraph breaks become newlines.
     */
    private function fromDocx(string $absolutePath): ?string
    {
        $zip = new \ZipArchive;

        if ($zip->open($absolutePath) !== true) {
            return null;
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($xml === false) {
            return null;
        }

        $xml = preg_replace('/<\/w:p>/', "\n", $xml);

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function fromPlainText(string $absolutePath): ?string
    {
        $contents = file_get_contents($absolutePath);

        if ($contents === false) {
            return null;
        }

        return mb_convert_encoding($contents, 'UTF-8', 'UTF-8');
    }
}

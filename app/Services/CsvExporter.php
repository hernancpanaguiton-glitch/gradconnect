<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Native-PHP CSV streaming (fputcsv, no dependency) — the "export options"
 * the manuscript's "Generate Reports" use case calls for. There is no PDF
 * generation library in this codebase; "print/save as PDF" is delivered via
 * the browser's native print dialog instead (see Résumé Builder, Phase 2a).
 */
class CsvExporter
{
    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     */
    public function stream(string $filename, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}

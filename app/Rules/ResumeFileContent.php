<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use ZipArchive;

/**
 * Check that an uploaded résumé really is what its extension claims.
 *
 * Laravel's `mimes` rule sniffs the file's content through the platform's
 * type-detection database, which reports a .docx (a zip container) as
 * application/zip on some machines — so valid résumés were rejected. Matching
 * on the extension alone would accept a renamed executable, so the extension
 * decides which parser runs and this rule confirms the bytes agree.
 */
class ResumeFileContent implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be a file.');

            return;
        }

        $path = $value->getRealPath();

        if ($path === false || ! is_readable($path)) {
            $fail('The :attribute could not be read.');

            return;
        }

        $valid = match (strtolower($value->getClientOriginalExtension())) {
            'pdf' => $this->isPdf($path),
            'docx' => $this->isDocx($path),
            'txt' => $this->isPlainText($path),
            default => false,
        };

        if (! $valid) {
            $fail('The :attribute does not look like a valid PDF, Word (.docx) or text document.');
        }
    }

    private function isPdf(string $path): bool
    {
        return str_starts_with((string) file_get_contents($path, length: 5), '%PDF-');
    }

    private function isDocx(string $path): bool
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            return false;
        }

        // Every Word document holds its body at this path; a plain zip does not.
        $isWordDocument = $zip->locateName('word/document.xml') !== false;
        $zip->close();

        return $isWordDocument;
    }

    private function isPlainText(string $path): bool
    {
        $sample = (string) file_get_contents($path, length: 8192);

        return ! str_contains($sample, "\0") && mb_check_encoding($sample, 'UTF-8');
    }
}

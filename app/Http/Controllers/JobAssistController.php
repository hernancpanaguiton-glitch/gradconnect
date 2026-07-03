<?php

namespace App\Http\Controllers;

use App\Services\JobContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobAssistController extends Controller
{
    public function __construct(private readonly JobContentService $jobContent) {}

    /**
     * Autocomplete suggestions for the job title field.
     */
    public function titles(Request $request): JsonResponse
    {
        return response()->json([
            'titles' => $this->jobContent->suggestTitles((string) $request->query('q', '')),
        ]);
    }

    /**
     * Draft a description from the job title.
     */
    public function description(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $text = $this->jobContent->generateDescription($data['title'], $data['company'] ?? null);

        return $this->generatedResponse($text);
    }

    /**
     * Draft a qualifications list from the job title (and optional description).
     */
    public function qualifications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $text = $this->jobContent->generateQualifications($data['title'], $data['description'] ?? null);

        return $this->generatedResponse($text);
    }

    private function generatedResponse(?string $text): JsonResponse
    {
        if ($text === null) {
            return response()->json([
                'message' => 'AI generation is unavailable. Add the Gemini or Groq API key to enable it.',
            ], 422);
        }

        return response()->json(['text' => $text]);
    }
}

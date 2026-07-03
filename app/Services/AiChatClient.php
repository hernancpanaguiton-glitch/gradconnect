<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper over the configured chat LLM (Groq first, Gemini fallback)
 * for lightweight, synchronous, request-time helpers (autocomplete,
 * validation, short generation). Returns null when no provider is
 * configured so callers can degrade gracefully.
 */
class AiChatClient
{
    public function hasProvider(): bool
    {
        return (bool) (config('services.groq.api_key') || config('services.gemini.api_key'));
    }

    /**
     * Send a prompt and decode a JSON object reply.
     *
     * @return array<string, mixed>|null
     */
    public function json(string $prompt): ?array
    {
        $raw = $this->send($prompt, json: true);

        if ($raw === null) {
            return null;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Send a prompt and return a plain-text reply (trimmed), or null.
     */
    public function text(string $prompt): ?string
    {
        $raw = $this->send($prompt, json: false);

        return $raw !== null && trim($raw) !== '' ? trim($raw) : null;
    }

    private function send(string $prompt, bool $json): ?string
    {
        try {
            return $this->callGroq($prompt, $json) ?? $this->callGemini($prompt, $json);
        } catch (\Throwable $e) {
            Log::warning('AI chat request threw', ['exception' => $e->getMessage()]);

            return null;
        }
    }

    private function callGroq(string $prompt, bool $json): ?string
    {
        $apiKey = config('services.groq.api_key');

        if (! $apiKey) {
            return null;
        }

        $payload = [
            'model' => config('services.groq.model'),
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'temperature' => 0.3,
        ];

        if ($json) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = Http::withToken($apiKey)->post(config('services.groq.api_url'), $payload);

        return $response->successful() ? $response->json('choices.0.message.content') : null;
    }

    private function callGemini(string $prompt, bool $json): ?string
    {
        $apiKey = config('services.gemini.api_key');

        if (! $apiKey) {
            return null;
        }

        $url = config('services.gemini.chat_url').'/'.config('services.gemini.chat_model').':generateContent';

        $payload = ['contents' => [['parts' => [['text' => $prompt]]]]];

        if ($json) {
            $payload['generationConfig'] = ['responseMimeType' => 'application/json'];
        }

        $response = Http::withQueryParameters(['key' => $apiKey])->post($url, $payload);

        return $response->successful() ? $response->json('candidates.0.content.parts.0.text') : null;
    }
}

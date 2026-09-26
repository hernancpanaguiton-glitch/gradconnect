<?php

namespace Tests\Unit\Services;

use App\Jobs\ScoreJobMatchesForJob;
use App\Jobs\ScoreJobMatchesForProfile;
use App\Services\AiChatClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiChatClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.groq.api_key' => 'groq-key',
            'services.groq.api_url' => 'https://groq.test/chat',
            'services.groq.model' => 'test-model',
            'services.gemini.api_key' => 'gemini-secret-key',
            'services.gemini.chat_model' => 'gemini-test',
        ]);
    }

    public function test_the_gemini_key_is_sent_as_a_header_not_in_the_url(): void
    {
        // A key in the query string reaches exception messages, application
        // logs and every proxy access log along the way.
        Http::fake([
            'groq.test/*' => Http::response([], 500),
            '*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'ok']]]]]]),
        ]);

        (new AiChatClient)->text('hello');

        Http::assertSent(function ($request) {
            if (! str_contains($request->url(), 'generativelanguage')) {
                return true;
            }

            return $request->hasHeader('x-goog-api-key', 'gemini-secret-key')
                && ! str_contains($request->url(), 'gemini-secret-key')
                && ! str_contains($request->url(), 'key=');
        });
    }

    public function test_a_groq_failure_still_falls_back_to_gemini(): void
    {
        // A thrown connection error used to escape past the fallback, so the
        // second provider only ran when the first answered cleanly but empty.
        Http::fake([
            'groq.test/*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('timed out'),
            '*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => 'from gemini']]]]]]),
        ]);

        $this->assertSame('from gemini', (new AiChatClient)->text('hello'));
    }

    public function test_the_queue_gives_a_matching_job_time_to_finish(): void
    {
        $jobTimeout = (new ScoreJobMatchesForJob(1))->timeout;
        $budget = (int) config('ai.matching.time_budget');
        $retryAfter = (int) config('queue.connections.database.retry_after');

        // retry_after shorter than the job's timeout means the queue hands a
        // still-running job to a second worker.
        $this->assertGreaterThan($jobTimeout, $retryAfter);
        $this->assertGreaterThan($budget, $jobTimeout);
        $this->assertSame($jobTimeout, (new ScoreJobMatchesForProfile(1))->timeout);
    }
}

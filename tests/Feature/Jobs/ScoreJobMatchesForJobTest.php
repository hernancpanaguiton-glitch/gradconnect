<?php

namespace Tests\Feature\Jobs;

use App\Jobs\ScoreJobMatchesForJob;
use App\Models\Company;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\ResumeMatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class ScoreJobMatchesForJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_delegates_to_the_matching_service_for_the_given_posting(): void
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->create();

        $service = $this->createMock(ResumeMatchingService::class);
        $service->expects($this->once())
            ->method('matchJobToCandidates')
            ->with($this->callback(fn (JobPosting $p) => $p->id === $posting->id))
            ->willReturn(new Collection);

        (new ScoreJobMatchesForJob($posting->id))->handle($service);
    }

    public function test_it_does_nothing_when_the_posting_no_longer_exists(): void
    {
        $service = $this->createMock(ResumeMatchingService::class);
        $service->expects($this->never())->method('matchJobToCandidates');

        (new ScoreJobMatchesForJob(999999))->handle($service);
    }
}

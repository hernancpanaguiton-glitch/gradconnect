<?php

namespace Tests\Feature\Jobs;

use App\Jobs\ScoreJobMatchesForProfile;
use App\Models\GraduateProfile;
use App\Models\User;
use App\Services\ResumeMatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class ScoreJobMatchesForProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_delegates_to_the_matching_service_for_the_given_profile(): void
    {
        $profile = GraduateProfile::factory()->for(User::factory()->create(), 'user')->create();

        $service = $this->createMock(ResumeMatchingService::class);
        $service->expects($this->once())
            ->method('matchProfileToJobs')
            ->with($this->callback(fn (GraduateProfile $p) => $p->id === $profile->id))
            ->willReturn(new Collection);

        (new ScoreJobMatchesForProfile($profile->id))->handle($service);
    }

    public function test_it_does_nothing_when_the_profile_no_longer_exists(): void
    {
        $service = $this->createMock(ResumeMatchingService::class);
        $service->expects($this->never())->method('matchProfileToJobs');

        (new ScoreJobMatchesForProfile(999999))->handle($service);
    }
}

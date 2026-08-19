<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\LearningResource;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillGapControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function makeOpenPosting(): JobPosting
    {
        $partner = User::factory()->create();
        $company = Company::factory()->for($partner, 'owner')->create();

        return JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();
    }

    public function test_graduate_without_a_profile_sees_an_empty_state(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('skill-gap'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SkillGap')
                ->where('hasProfile', false)
                ->where('hasMatches', false)
                ->has('gaps', 0)
            );
    }

    public function test_profile_without_matches_sees_no_matches_state(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->get(route('skill-gap'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasProfile', true)
                ->where('hasMatches', false)
            );
    }

    public function test_gaps_and_strengths_are_ranked_by_frequency_across_matches(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        Skill::findOrCreateByName('Docker');
        $profile->skills()->attach(Skill::findOrCreateByName('PHP')->id, ['source' => 'self']);

        $jobA = $this->makeOpenPosting();
        $jobB = $this->makeOpenPosting();
        $jobC = $this->makeOpenPosting();

        $profile->matchResults()->create([
            'job_posting_id' => $jobA->id, 'fit_score' => 70,
            'skill_gaps' => ['Docker', 'Kubernetes'], 'matched_skills' => ['PHP'],
        ]);
        $profile->matchResults()->create([
            'job_posting_id' => $jobB->id, 'fit_score' => 60,
            'skill_gaps' => ['Docker'], 'matched_skills' => ['PHP'],
        ]);
        $profile->matchResults()->create([
            'job_posting_id' => $jobC->id, 'fit_score' => 40,
            'skill_gaps' => [], 'matched_skills' => ['PHP', 'Laravel'],
        ]);

        $this->actingAs($alumni)->get(route('skill-gap'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('hasMatches', true)
                ->where('totalMatches', 3)
                // Docker is missing in 2 of 3 matches -> ranked first, 67%.
                ->where('gaps.0.skill', 'Docker')
                ->where('gaps.0.count', 2)
                ->where('gaps.0.percent', 67)
                ->where('gaps.1.skill', 'Kubernetes')
                // PHP matched in all 3 -> ranked first, 100%.
                ->where('strengths.0.skill', 'PHP')
                ->where('strengths.0.count', 3)
                ->where('strengths.0.percent', 100)
            );
    }

    public function test_only_open_postings_count_toward_the_analysis(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();

        $closed = $this->makeOpenPosting();
        $closed->update(['status' => 'closed']);
        $profile->matchResults()->create([
            'job_posting_id' => $closed->id, 'fit_score' => 90,
            'skill_gaps' => ['Rust'], 'matched_skills' => [],
        ]);

        $this->actingAs($alumni)->get(route('skill-gap'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('hasMatches', false)->where('totalMatches', 0));
    }

    public function test_industry_partner_is_forbidden(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('skill-gap'))->assertForbidden();
    }

    public function test_gaps_include_recommended_learning_resources(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $docker = Skill::findOrCreateByName('Docker');

        $resource = LearningResource::factory()->create(['title' => 'Docker for Beginners']);
        $resource->skills()->attach($docker->id);

        $unrelated = LearningResource::factory()->create(['title' => 'Public Speaking 101']);
        $unrelated->skills()->attach(Skill::findOrCreateByName('Communication')->id);

        $job = $this->makeOpenPosting();
        $profile->matchResults()->create([
            'job_posting_id' => $job->id, 'fit_score' => 50,
            'skill_gaps' => ['Docker'], 'matched_skills' => [],
        ]);

        $this->actingAs($alumni)->get(route('skill-gap'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('gaps.0.skill', 'Docker')
                ->has('gaps.0.resources', 1)
                ->where('gaps.0.resources.0.title', 'Docker for Beginners')
            );
    }
}

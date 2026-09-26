<?php

namespace Tests\Feature;

use App\Jobs\GenerateResumeEmbedding;
use App\Models\GraduateProfile;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResumeBuilderControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_index_sends_the_relations_the_page_reads_for_a_brand_new_profile(): void
    {
        // A graduate who has never opened their profile has no row yet, so the
        // builder creates one. ->with() only eager-loads on the "found" branch
        // of firstOrCreate, so the created model carried none of these keys and
        // the page's `profile.skills.length` threw — a white screen on the
        // first click of "Build from My Profile".
        $alumni = User::factory()->alumni()->create();
        $this->assertNull($alumni->graduateProfile);

        $this->actingAs($alumni)
            ->get(route('resume-builder.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Graduate/ResumeBuilder')
                ->has('profile.skills')
                ->has('profile.education_records')
                ->has('profile.employment_records'));
    }

    public function test_index_renders_the_builder_with_profile_data(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create(['headline' => 'Backend Developer']);

        $this->actingAs($alumni)->get(route('resume-builder.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Graduate/ResumeBuilder')
                ->where('profile.headline', 'Backend Developer')
            );
    }

    public function test_building_an_empty_profile_is_rejected(): void
    {
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create([
            'headline' => null, 'summary' => null, 'program' => null,
        ]);

        $this->actingAs($alumni)->post(route('resume-builder.store'))->assertStatus(422);

        $this->assertDatabaseCount('resumes', 0);
    }

    public function test_building_from_a_populated_profile_creates_a_primary_built_resume(): void
    {
        Storage::fake('local');
        Queue::fake();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create(['headline' => 'Backend Developer']);
        $profile->skills()->attach(Skill::findOrCreateByName('Laravel')->id, ['source' => 'self']);

        $this->actingAs($alumni)->post(route('resume-builder.store'))->assertRedirect(route('resumes.index'));

        $resume = $profile->resumes()->first();
        $this->assertNotNull($resume);
        $this->assertSame('built', $resume->source);
        $this->assertTrue($resume->is_primary);
        Storage::disk('local')->assertExists($resume->path);
        Queue::assertPushed(GenerateResumeEmbedding::class, fn ($job) => $job->resumeId === $resume->id);
    }

    public function test_a_second_built_resume_is_not_made_primary(): void
    {
        Storage::fake('local');
        Queue::fake();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create(['headline' => 'Backend Developer']);
        $profile->resumes()->create([
            'original_filename' => 'existing.pdf', 'path' => 'resumes/x.pdf',
            'is_primary' => true, 'source' => 'uploaded', 'embedding_status' => 'done',
        ]);

        $this->actingAs($alumni)->post(route('resume-builder.store'));

        $built = $profile->resumes()->where('source', 'built')->first();
        $this->assertFalse($built->is_primary);
    }

    public function test_industry_partner_cannot_access_the_resume_builder(): void
    {
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($partner)->get(route('resume-builder.index'))->assertForbidden();
        $this->actingAs($partner)->post(route('resume-builder.store'))->assertForbidden();
    }
}

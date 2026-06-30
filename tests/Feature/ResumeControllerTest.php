<?php

namespace Tests\Feature;

use App\Jobs\GenerateResumeEmbedding;
use App\Models\GraduateProfile;
use App\Models\Resume;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResumeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_alumni_can_view_their_resumes(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        Resume::factory()->for($profile)->create();

        $this->actingAs($alumni)->get('/graduate/resumes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Graduate/Resumes'));
    }

    public function test_uploading_a_resume_dispatches_the_embedding_job(): void
    {
        Storage::fake('local');
        Queue::fake();

        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post('/graduate/resumes', [
                'file' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
            ])
            ->assertRedirect();

        $profile = $alumni->graduateProfile()->first();

        $this->assertDatabaseHas('resumes', [
            'graduate_profile_id' => $profile->id,
            'original_filename' => 'resume.pdf',
            'is_primary' => true,
            'embedding_status' => 'pending',
        ]);

        Queue::assertPushed(GenerateResumeEmbedding::class);
    }

    public function test_first_uploaded_resume_is_marked_primary_and_subsequent_are_not(): void
    {
        Storage::fake('local');
        Queue::fake();

        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post('/graduate/resumes', [
            'file' => UploadedFile::fake()->create('first.pdf', 100, 'application/pdf'),
        ]);
        $this->actingAs($alumni)->post('/graduate/resumes', [
            'file' => UploadedFile::fake()->create('second.pdf', 100, 'application/pdf'),
        ]);

        $this->assertDatabaseHas('resumes', ['original_filename' => 'first.pdf', 'is_primary' => true]);
        $this->assertDatabaseHas('resumes', ['original_filename' => 'second.pdf', 'is_primary' => false]);
    }

    public function test_a_non_pdf_upload_is_rejected(): void
    {
        Storage::fake('local');

        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)
            ->post('/graduate/resumes', [
                'file' => UploadedFile::fake()->create('resume.docx', 100, 'application/msword'),
            ])
            ->assertSessionHasErrors('file');
    }

    public function test_owner_can_delete_their_resume(): void
    {
        Storage::fake('local');

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $resume = Resume::factory()->for($profile)->create(['path' => 'resumes/1/fake.pdf']);

        $this->actingAs($alumni)
            ->delete("/graduate/resumes/{$resume->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('resumes', ['id' => $resume->id]);
    }

    public function test_a_user_cannot_delete_another_users_resume(): void
    {
        $owner = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($owner, 'user')->create();
        $resume = Resume::factory()->for($profile)->create();

        $intruder = User::factory()->alumni()->create();

        $this->actingAs($intruder)
            ->delete("/graduate/resumes/{$resume->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('resumes', ['id' => $resume->id]);
    }

    public function test_owner_can_set_a_resume_as_primary(): void
    {
        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        $first = Resume::factory()->for($profile)->create(['is_primary' => true]);
        $second = Resume::factory()->for($profile)->create(['is_primary' => false]);

        $this->actingAs($alumni)
            ->patch("/graduate/resumes/{$second->id}/primary")
            ->assertRedirect();

        $this->assertFalse($first->fresh()->is_primary);
        $this->assertTrue($second->fresh()->is_primary);
    }
}

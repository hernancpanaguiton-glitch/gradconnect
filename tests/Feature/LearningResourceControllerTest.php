<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\GraduateProfile;
use App\Models\LearningResource;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningResourceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_manager_sees_every_resource(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        LearningResource::factory()->count(3)->create();

        $this->actingAs($aao)->get(route('learning-resources.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('LearningResources/Index')
                ->has('resources', 3)
                ->where('canManage', true)
            );
    }

    public function test_student_sees_general_and_own_department_resources_only(): void
    {
        $ccs = Department::create(['name' => 'College of Computer Studies', 'code' => 'CCS', 'type' => 'college']);
        $cob = Department::create(['name' => 'College of Business', 'code' => 'COB', 'type' => 'college']);

        $student = User::factory()->student()->create();
        GraduateProfile::factory()->for($student, 'user')->create(['department_id' => $ccs->id]);

        LearningResource::factory()->create(['department_id' => null, 'title' => 'General resource']);
        LearningResource::factory()->create(['department_id' => $ccs->id, 'title' => 'CCS resource']);
        LearningResource::factory()->create(['department_id' => $cob->id, 'title' => 'COB resource']);

        $this->actingAs($student)->get(route('learning-resources.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('canManage', false)
                ->has('resources', 2)
            );
    }

    public function test_alumni_without_permission_is_forbidden(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('learning-resources.index'))->assertForbidden();
    }

    public function test_manager_can_create_a_resource_with_skills(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $docker = Skill::findOrCreateByName('Docker');

        $this->actingAs($aao)->post(route('learning-resources.store'), [
            'title' => 'Docker Essentials',
            'type' => 'course',
            'provider' => 'Coursera',
            'url' => 'https://example.com/docker',
            'skill_ids' => [$docker->id],
        ])->assertRedirect(route('learning-resources.index'));

        $resource = LearningResource::where('title', 'Docker Essentials')->firstOrFail();
        $this->assertTrue($resource->skills->contains($docker));
    }

    public function test_manager_can_update_a_resources_skills(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $resource = LearningResource::factory()->create();
        $docker = Skill::findOrCreateByName('Docker');
        $kubernetes = Skill::findOrCreateByName('Kubernetes');
        $resource->skills()->sync([$docker->id]);

        $this->actingAs($aao)->patch(route('learning-resources.update', $resource), [
            'title' => $resource->title,
            'type' => $resource->type,
            'skill_ids' => [$kubernetes->id],
        ])->assertRedirect();

        $resource->refresh();
        $this->assertFalse($resource->skills->contains($docker));
        $this->assertTrue($resource->skills->contains($kubernetes));
    }

    public function test_manager_can_delete_a_resource(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $resource = LearningResource::factory()->create();

        $this->actingAs($aao)->delete(route('learning-resources.destroy', $resource))->assertRedirect();

        $this->assertDatabaseMissing('learning_resources', ['id' => $resource->id]);
    }

    public function test_student_cannot_create_a_resource(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)->get(route('learning-resources.create'))->assertForbidden();
        $this->actingAs($student)->post(route('learning-resources.store'), ['title' => 'x', 'type' => 'course'])->assertForbidden();
    }
}

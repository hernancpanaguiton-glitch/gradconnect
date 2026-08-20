<?php

namespace Tests\Feature;

use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_alumni_can_post_and_comment(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('community.store'), ['body' => 'Hello everyone!'])->assertRedirect();
        $post = CommunityPost::firstWhere('body', 'Hello everyone!');
        $this->assertNotNull($post);

        $this->actingAs($alumni)->post(route('community.comments.store', $post), ['body' => 'Nice!'])->assertRedirect();
        $this->assertDatabaseHas('community_comments', ['community_post_id' => $post->id, 'body' => 'Nice!']);
    }

    public function test_student_cannot_participate_in_the_community(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)->get(route('community.index'))->assertForbidden();
        $this->actingAs($student)->post(route('community.store'), ['body' => 'x'])->assertForbidden();
    }

    public function test_author_can_delete_their_own_post_but_not_someone_elses(): void
    {
        $author = User::factory()->alumni()->create();
        $other = User::factory()->alumni()->create();
        $post = CommunityPost::create(['user_id' => $author->id, 'body' => 'mine']);

        $this->actingAs($other)->delete(route('community.destroy', $post))->assertForbidden();
        $this->actingAs($author)->delete(route('community.destroy', $post))->assertRedirect();
        $this->assertDatabaseMissing('community_posts', ['id' => $post->id]);
    }

    public function test_aao_can_moderate_delete_anyones_post_and_comment(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        $post = CommunityPost::create(['user_id' => $alumni->id, 'body' => 'spam']);
        $comment = CommunityComment::create(['community_post_id' => $post->id, 'user_id' => $alumni->id, 'body' => 'spam reply']);

        $this->actingAs($aao)->delete(route('community.comments.destroy', $comment))->assertRedirect();
        $this->assertDatabaseMissing('community_comments', ['id' => $comment->id]);

        $this->actingAs($aao)->delete(route('community.destroy', $post))->assertRedirect();
        $this->assertDatabaseMissing('community_posts', ['id' => $post->id]);
    }

    public function test_aao_can_view_but_not_post_without_participate_permission(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->get(route('community.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('canPost', false)->where('canModerate', true));

        $this->actingAs($aao)->post(route('community.store'), ['body' => 'x'])->assertForbidden();
    }
}

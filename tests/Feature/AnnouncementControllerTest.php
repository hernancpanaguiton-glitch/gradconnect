<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementPublished;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AnnouncementControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_list_announcements(): void
    {
        $admin = User::factory()->admin()->create();
        Announcement::factory()->for($admin, 'createdBy')->count(2)->create();

        $this->actingAs($admin)->get(route('announcements.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Announcements/Index')->has('announcements', 2));
    }

    public function test_alumni_cannot_manage_announcements(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('announcements.index'))->assertForbidden();
        $this->actingAs($alumni)->get(route('announcements.create'))->assertForbidden();
    }

    public function test_publishing_notifies_the_targeted_audience_only(): void
    {
        Notification::fake();

        $aao = User::factory()->alumniAffairs()->create();
        $alumni = User::factory()->alumni()->create();
        $student = User::factory()->student()->create();

        $this->actingAs($aao)->post(route('announcements.store'), [
            'title' => 'Alumni Homecoming',
            'body' => 'Join us next month.',
            'audience' => 'alumni',
            'status' => 'published',
        ])->assertRedirect(route('announcements.index'));

        Notification::assertSentTo($alumni, AnnouncementPublished::class);
        Notification::assertNotSentTo($student, AnnouncementPublished::class);
        $this->assertDatabaseHas('announcements', ['title' => 'Alumni Homecoming', 'audience' => 'alumni']);
    }

    public function test_everyone_audience_notifies_all_active_users(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $alumni = User::factory()->alumni()->create();
        $partner = User::factory()->industryPartner()->create();

        $this->actingAs($admin)->post(route('announcements.store'), [
            'title' => 'Platform Maintenance',
            'body' => 'Scheduled downtime this weekend.',
            'audience' => '',
            'status' => 'published',
        ]);

        Notification::assertSentTo($alumni, AnnouncementPublished::class);
        Notification::assertSentTo($partner, AnnouncementPublished::class);
    }

    public function test_draft_does_not_notify_anyone(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($admin)->post(route('announcements.store'), [
            'title' => 'Draft Notice',
            'body' => 'Not ready yet.',
            'audience' => '',
            'status' => 'draft',
        ]);

        Notification::assertNothingSentTo($alumni);
    }

    public function test_publishing_a_draft_on_update_notifies_once(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $alumni = User::factory()->alumni()->create();
        $announcement = Announcement::factory()->draft()->for($admin, 'createdBy')->create();

        $this->actingAs($admin)->patch(route('announcements.update', $announcement), [
            'title' => $announcement->title,
            'body' => $announcement->body,
            'audience' => '',
            'status' => 'published',
        ])->assertRedirect();

        Notification::assertSentTo($alumni, AnnouncementPublished::class, 1);

        // Editing an already-published announcement again must not re-notify.
        $this->actingAs($admin)->patch(route('announcements.update', $announcement), [
            'title' => 'Updated title',
            'body' => $announcement->body,
            'audience' => '',
            'status' => 'published',
        ]);

        Notification::assertSentTo($alumni, AnnouncementPublished::class, 1);
    }

    public function test_admin_can_delete_an_announcement(): void
    {
        $admin = User::factory()->admin()->create();
        $announcement = Announcement::factory()->for($admin, 'createdBy')->create();

        $this->actingAs($admin)->delete(route('announcements.destroy', $announcement))->assertRedirect();

        $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    }
}

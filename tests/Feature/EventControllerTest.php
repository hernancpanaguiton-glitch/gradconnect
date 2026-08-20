<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Career Fair 2026',
            'type' => 'career_fair',
            'starts_at' => now()->addWeek()->toDateTimeString(),
            'status' => 'published',
        ], $overrides);
    }

    public function test_alumni_affairs_can_create_an_event(): void
    {
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($aao)->post(route('events.store'), $this->payload())->assertRedirect();

        $this->assertDatabaseHas('events', ['title' => 'Career Fair 2026', 'created_by_user_id' => $aao->id]);
    }

    public function test_sao_can_create_an_event(): void
    {
        $sao = User::factory()->sao()->create();

        $this->actingAs($sao)->post(route('events.store'), $this->payload(['title' => 'Student Orientation']))->assertRedirect();

        $this->assertDatabaseHas('events', ['title' => 'Student Orientation']);
    }

    public function test_alumni_cannot_create_an_event(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('events.store'), $this->payload())->assertForbidden();
    }

    public function test_non_managers_see_only_published_events(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        Event::factory()->for($aao, 'createdBy')->create(['status' => 'draft']);
        Event::factory()->for($aao, 'createdBy')->create(['status' => 'published']);

        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('events'))
            ->assertInertia(fn ($page) => $page->has('events', 1)->where('canManage', false));

        $this->actingAs($aao)->get(route('events'))
            ->assertInertia(fn ($page) => $page->has('events', 2)->where('canManage', true));
    }

    public function test_rsvp_going_and_interested_updates_going_count(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $event = Event::factory()->for($aao, 'createdBy')->create(['status' => 'published']);
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('events.rsvp', $event), ['status' => 'going'])->assertRedirect();

        $this->assertDatabaseHas('event_rsvps', ['event_id' => $event->id, 'user_id' => $alumni->id, 'status' => 'going']);

        $this->actingAs($alumni)->get(route('events'))
            ->assertInertia(fn ($page) => $page->where('events.0.going_count', 1)->where('events.0.my_rsvp', 'going'));
    }

    public function test_rsvp_is_rejected_once_event_is_at_capacity(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $event = Event::factory()->for($aao, 'createdBy')->create(['status' => 'published', 'capacity' => 1]);

        $first = User::factory()->alumni()->create();
        $this->actingAs($first)->post(route('events.rsvp', $event), ['status' => 'going'])->assertRedirect();

        $second = User::factory()->alumni()->create();
        $this->actingAs($second)->post(route('events.rsvp', $event), ['status' => 'going'])->assertStatus(422);
    }

    public function test_switching_own_rsvp_at_capacity_is_still_allowed(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $event = Event::factory()->for($aao, 'createdBy')->create(['status' => 'published', 'capacity' => 1]);
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->post(route('events.rsvp', $event), ['status' => 'going'])->assertRedirect();
        $this->actingAs($alumni)->post(route('events.rsvp', $event), ['status' => 'interested'])->assertRedirect();
        $this->actingAs($alumni)->post(route('events.rsvp', $event), ['status' => 'going'])->assertRedirect();

        $this->assertDatabaseHas('event_rsvps', ['event_id' => $event->id, 'user_id' => $alumni->id, 'status' => 'going']);
    }

    public function test_only_a_manager_can_delete_an_event(): void
    {
        $aao = User::factory()->alumniAffairs()->create();
        $event = Event::factory()->for($aao, 'createdBy')->create();
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->delete(route('events.destroy', $event))->assertForbidden();
        $this->actingAs($aao)->delete(route('events.destroy', $event))->assertRedirect();
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }
}

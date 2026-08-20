<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Conversation;
use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_graduate_can_start_a_conversation_with_staff(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($alumni)->post(route('messages.start'), ['recipient_user_id' => $aao->id])->assertRedirect();

        $this->assertDatabaseHas('conversations', []);
        $this->assertSame(1, Conversation::count());
    }

    public function test_starting_the_same_conversation_twice_does_not_duplicate(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();

        $this->actingAs($alumni)->post(route('messages.start'), ['recipient_user_id' => $aao->id]);
        $this->actingAs($alumni)->post(route('messages.start'), ['recipient_user_id' => $aao->id]);

        $this->assertSame(1, Conversation::count());
    }

    public function test_graduate_can_message_a_partner_they_applied_to(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $company = Company::factory()->for($partner, 'owner')->create();
        $posting = JobPosting::factory()->for($company)->for($partner, 'postedBy')->open()->create();

        $alumni = User::factory()->alumni()->create();
        $profile = GraduateProfile::factory()->for($alumni, 'user')->create();
        JobApplication::create(['job_posting_id' => $posting->id, 'graduate_profile_id' => $profile->id, 'status' => 'submitted', 'applied_at' => now()]);

        $this->actingAs($alumni)->post(route('messages.start'), ['recipient_user_id' => $partner->id])->assertRedirect();

        $this->assertSame(1, Conversation::count());
    }

    public function test_graduate_cannot_message_a_partner_they_never_applied_to(): void
    {
        $partner = User::factory()->industryPartner()->create();
        $alumni = User::factory()->alumni()->create();
        GraduateProfile::factory()->for($alumni, 'user')->create();

        $this->actingAs($alumni)->post(route('messages.start'), ['recipient_user_id' => $partner->id])->assertForbidden();
    }

    public function test_two_graduates_cannot_message_each_other(): void
    {
        $a = User::factory()->alumni()->create();
        $b = User::factory()->alumni()->create();

        $this->actingAs($a)->post(route('messages.start'), ['recipient_user_id' => $b->id])->assertForbidden();
    }

    public function test_participant_can_send_and_read_messages(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        $conversation = Conversation::create();
        $conversation->participants()->attach([$alumni->id, $aao->id]);

        $this->actingAs($alumni)->post(route('messages.send', $conversation), ['body' => 'Hello!'])->assertRedirect();

        $this->assertDatabaseHas('messages', ['conversation_id' => $conversation->id, 'sender_user_id' => $alumni->id, 'body' => 'Hello!']);

        $this->actingAs($aao)->get(route('messages.show', $conversation))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('active.messages.0.body', 'Hello!')
                ->where('active.messages.0.mine', false)
            );
    }

    public function test_non_participant_cannot_view_or_send_to_a_conversation(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        $conversation = Conversation::create();
        $conversation->participants()->attach([$alumni->id, $aao->id]);

        $outsider = User::factory()->alumni()->create();

        $this->actingAs($outsider)->get(route('messages.show', $conversation))->assertForbidden();
        $this->actingAs($outsider)->post(route('messages.send', $conversation), ['body' => 'x'])->assertForbidden();
    }

    public function test_unread_is_true_until_the_recipient_opens_the_conversation(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        $conversation = Conversation::create();
        $conversation->participants()->attach([$alumni->id, $aao->id]);
        $conversation->messages()->create(['sender_user_id' => $alumni->id, 'body' => 'Hi']);

        $this->actingAs($aao)->get(route('messages'))
            ->assertInertia(fn ($page) => $page->where('conversations.0.unread', true));

        // Viewing the conversation marks it read.
        $this->actingAs($aao)->get(route('messages.show', $conversation));

        $this->actingAs($aao)->get(route('messages'))
            ->assertInertia(fn ($page) => $page->where('conversations.0.unread', false));
    }

    public function test_sender_never_sees_their_own_message_as_unread(): void
    {
        $alumni = User::factory()->alumni()->create();
        $aao = User::factory()->alumniAffairs()->create();
        $conversation = Conversation::create();
        $conversation->participants()->attach([$alumni->id, $aao->id]);
        $conversation->messages()->create(['sender_user_id' => $alumni->id, 'body' => 'Hi']);

        $this->actingAs($alumni)->get(route('messages'))
            ->assertInertia(fn ($page) => $page->where('conversations.0.unread', false));
    }
}

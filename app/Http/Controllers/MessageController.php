<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    /**
     * Graduate <-> employer and graduate <-> office messaging. Graduates
     * start conversations (with staff, or with a partner they've applied
     * to); staff and partners can only reply within an existing thread —
     * this keeps the feature bounded without a full user directory search.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Messages', [
            'conversations' => $this->conversationsList($user),
            'messageableUsers' => $this->messageableUsers($user),
            'active' => null,
        ]);
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();
        abort_unless($conversation->participants()->where('users.id', $user->id)->exists(), 403);

        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        $messages = $conversation->messages()->with('sender')->get();
        $other = $conversation->participants()->where('users.id', '!=', $user->id)->first();

        return Inertia::render('Messages', [
            'conversations' => $this->conversationsList($user),
            'messageableUsers' => $this->messageableUsers($user),
            'active' => [
                'id' => $conversation->id,
                'other' => $other ? ['id' => $other->id, 'name' => $other->name] : null,
                'messages' => $messages->map(fn ($message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'mine' => $message->sender_user_id === $user->id,
                    'created_at' => $message->created_at,
                ])->values(),
            ],
        ]);
    }

    /**
     * Start (or resume) a conversation with an eligible recipient.
     */
    public function start(Request $request): RedirectResponse
    {
        $data = $request->validate(['recipient_user_id' => ['required', 'exists:users,id']]);
        $recipient = User::findOrFail($data['recipient_user_id']);
        $user = $request->user();

        abort_unless($this->canMessage($user, $recipient), 403);

        $conversation = Conversation::whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $recipient->id))
            ->first();

        if ($conversation === null) {
            $conversation = Conversation::create();
            $conversation->participants()->attach([$user->id, $recipient->id]);
        }

        return redirect()->route('messages.show', $conversation);
    }

    public function sendMessage(Request $request, Conversation $conversation): RedirectResponse
    {
        $user = $request->user();
        abort_unless($conversation->participants()->where('users.id', $user->id)->exists(), 403);

        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);

        $conversation->messages()->create(['sender_user_id' => $user->id, 'body' => $data['body']]);
        $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);

        return back();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function conversationsList(User $user): Collection
    {
        return $user->conversations()
            ->with(['participants', 'latestMessage'])
            ->get()
            ->sortByDesc(fn (Conversation $c) => $c->latestMessage?->created_at)
            ->map(function (Conversation $c) use ($user) {
                $other = $c->participants->firstWhere('id', '!=', $user->id);
                $lastReadAt = $c->pivot->last_read_at;
                $unread = $c->latestMessage
                    && $c->latestMessage->sender_user_id !== $user->id
                    && ($lastReadAt === null || $c->latestMessage->created_at->gt($lastReadAt));

                return [
                    'id' => $c->id,
                    'other' => $other ? ['id' => $other->id, 'name' => $other->name] : null,
                    'last_message' => $c->latestMessage?->body,
                    'last_message_at' => $c->latestMessage?->created_at,
                    'unread' => $unread,
                ];
            })
            ->values();
    }

    /**
     * Who this user is allowed to start a brand-new conversation with.
     *
     * @return array<int, array<string, mixed>>
     */
    private function messageableUsers(User $user): array
    {
        if (! $user->isGraduate()) {
            return [];
        }

        $staff = User::role(['alumni_affairs', 'sao', 'department_head', 'admin'])
            ->get()
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'role' => $u->getRoleNames()->first()]);

        $profile = $user->graduateProfile;
        $partners = $profile
            ? JobApplication::where('graduate_profile_id', $profile->id)
                ->with('jobPosting.company.owner')
                ->get()
                ->map(fn (JobApplication $application) => $application->jobPosting?->company?->owner)
                ->filter()
                ->unique('id')
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'role' => 'industry_partner'])
            : collect();

        return $staff->merge($partners)->unique('id')->values()->all();
    }

    private function canMessage(User $a, User $b): bool
    {
        if ($a->id === $b->id) {
            return false;
        }

        if ($a->isGraduate() && $b->isStaff()) {
            return true;
        }

        if ($b->isGraduate() && $a->isStaff()) {
            return true;
        }

        $graduate = $a->isGraduate() ? $a : ($b->isGraduate() ? $b : null);
        $partner = $a->hasRole('industry_partner') ? $a : ($b->hasRole('industry_partner') ? $b : null);

        if ($graduate === null || $partner === null || $graduate->id === $partner->id) {
            return false;
        }

        $profile = $graduate->graduateProfile;

        return $profile !== null && JobApplication::where('graduate_profile_id', $profile->id)
            ->whereHas('jobPosting.company', fn ($q) => $q->where('owner_user_id', $partner->id))
            ->exists();
    }
}

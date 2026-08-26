<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Career fairs, workshops, and alumni/student gatherings (FDD AAO
     * "organize alumni engagement activities"; FDD SAO "student events").
     * One shared events board — AAO and SAO both manage it, everyone reads
     * it — rather than two parallel systems for what the storyboard already
     * shows as a single "Events" page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $this->canManage($user);

        $query = Event::with('createdBy')->orderBy('starts_at');
        if (! $canManage) {
            $query->published();
        }
        $events = $query->get();

        $eventIds = $events->pluck('id');
        $myRsvps = EventRsvp::where('user_id', $user->id)->whereIn('event_id', $eventIds)->pluck('status', 'event_id');
        $goingCounts = EventRsvp::whereIn('event_id', $eventIds)->where('status', 'going')
            ->selectRaw('event_id, count(*) as total')->groupBy('event_id')->pluck('total', 'event_id');

        return Inertia::render('Events', [
            'events' => $events->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'type' => $event->type,
                'location' => $event->location,
                'starts_at' => $event->starts_at,
                'ends_at' => $event->ends_at,
                'capacity' => $event->capacity,
                'status' => $event->status,
                'created_by' => $event->createdBy->name,
                'going_count' => $goingCounts->get($event->id, 0),
                'my_rsvp' => $myRsvps->get($event->id),
            ])->values(),
            'canManage' => $canManage,
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);

        Event::create([...$request->validated(), 'created_by_user_id' => $request->user()->id]);

        return back()->with('success', 'Event created.');
    }

    public function update(StoreEventRequest $request, Event $event): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);

        $event->update($request->validated());

        return back()->with('success', 'Event updated.');
    }

    public function destroy(Request $request, Event $event): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);

        $event->delete();

        return back()->with('success', 'Event deleted.');
    }

    /**
     * RSVP to an event — this is what gives AAO's dashboard a real
     * "monitor alumni engagement" signal instead of a fabricated one.
     */
    public function rsvp(Request $request, Event $event): RedirectResponse
    {
        // index() only lists published events, but the RSVP endpoint was
        // reachable by ID, so a draft or cancelled event could collect RSVPs.
        // Managers may still RSVP to their own drafts while previewing.
        abort_unless(
            $event->status === 'published' || $this->canManage($request->user()),
            422,
            'This event is not open for RSVPs.',
        );

        $request->validate(['status' => ['required', 'in:going,interested,cancelled']]);

        $existing = EventRsvp::where('event_id', $event->id)->where('user_id', $request->user()->id)->first();

        if ($request->string('status') == 'going' && $existing?->status !== 'going' && $event->capacity !== null) {
            abort_if($event->goingCount() >= $event->capacity, 422, 'This event is at capacity.');
        }

        EventRsvp::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $request->user()->id],
            ['status' => $request->input('status')],
        );

        return back()->with('success', 'RSVP updated.');
    }

    private function canManage(User $user): bool
    {
        return $user->hasPermissionTo('career_activities.manage') || $user->hasPermissionTo('student_events.manage');
    }
}

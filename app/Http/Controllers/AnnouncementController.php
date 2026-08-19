<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Models\Announcement;
use App\Notifications\AnnouncementPublished;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    /**
     * List announcements (FR11 Administration — "manage ... announcements").
     * Managers see everything including drafts; everyone else's read surface
     * is the existing Notifications bell/page, which AnnouncementPublished
     * already delivers to — this index is management-only.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        $announcements = Announcement::with('createdBy')->latest()->get();

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        return Inertia::render('Announcements/Create');
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        $announcement = Announcement::create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()->id,
            'published_at' => $request->input('status') === 'published' ? now() : null,
        ]);

        if ($announcement->status === 'published') {
            Notification::send($announcement->notifiableUsers(), new AnnouncementPublished($announcement));
        }

        return redirect()->route('announcements.index')->with('success', 'Announcement created.');
    }

    public function edit(Request $request, Announcement $announcement): Response
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(StoreAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        $wasPublished = $announcement->status === 'published';

        $announcement->fill($request->validated());
        if ($announcement->status === 'published' && $announcement->published_at === null) {
            $announcement->published_at = now();
        }
        $announcement->save();

        // Only notify the first time an announcement goes live, not on every edit.
        if (! $wasPublished && $announcement->status === 'published') {
            Notification::send($announcement->notifiableUsers(), new AnnouncementPublished($announcement));
        }

        return back()->with('success', 'Announcement updated.');
    }

    public function destroy(Request $request, Announcement $announcement): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('announcements.manage'), 403);

        $announcement->delete();

        return redirect()->route('announcements.index')->with('success', 'Announcement deleted.');
    }
}

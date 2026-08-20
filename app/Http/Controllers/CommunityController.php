<?php

namespace App\Http\Controllers;

use App\Models\CommunityComment;
use App\Models\CommunityPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    /**
     * Alumni Community (FR15; FDD Alumni "Join Alumni Community") — the one
     * headline feature that had zero implementation. Alumni post/comment;
     * AAO/Admin moderate.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasPermissionTo('community.participate') || $user->hasPermissionTo('community.moderate'), 403);

        $posts = CommunityPost::with(['user', 'comments.user'])->withCount('comments')->latest()->get();

        return Inertia::render('Community', [
            'posts' => $posts,
            'canPost' => $user->hasPermissionTo('community.participate'),
            'canModerate' => $user->hasPermissionTo('community.moderate'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('community.participate'), 403);

        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        CommunityPost::create(['user_id' => $request->user()->id, 'body' => $data['body']]);

        return back()->with('success', 'Posted.');
    }

    public function destroy(Request $request, CommunityPost $communityPost): RedirectResponse
    {
        $this->authorizeModify($request, $communityPost->user_id);

        $communityPost->delete();

        return back()->with('success', 'Post removed.');
    }

    public function storeComment(Request $request, CommunityPost $communityPost): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('community.participate'), 403);

        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        $communityPost->comments()->create(['user_id' => $request->user()->id, 'body' => $data['body']]);

        return back()->with('success', 'Comment added.');
    }

    public function destroyComment(Request $request, CommunityComment $communityComment): RedirectResponse
    {
        $this->authorizeModify($request, $communityComment->user_id);

        $communityComment->delete();

        return back()->with('success', 'Comment removed.');
    }

    private function authorizeModify(Request $request, int $ownerId): void
    {
        $user = $request->user();
        abort_unless($ownerId === $user->id || $user->hasPermissionTo('community.moderate'), 403);
    }
}

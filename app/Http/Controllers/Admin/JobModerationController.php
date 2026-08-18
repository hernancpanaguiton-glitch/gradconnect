<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class JobModerationController extends Controller
{
    /**
     * Platform-wide job posting list for Admin (FDD Admin box; the
     * `job_postings.moderate` permission and JobPostingPolicy::moderate()
     * already existed but nothing called them until this controller).
     */
    public function index(Request $request): Response
    {
        $this->authorize('moderate', JobPosting::class);

        $search = trim((string) $request->input('search', ''));
        $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $postings = JobPosting::query()
            ->with('company')
            ->withCount('applications')
            ->when($search, function ($query) use ($search, $like) {
                $query->where(function ($q) use ($search, $like) {
                    $q->where('title', $like, "%{$search}%")
                        ->orWhereHas('company', fn ($c) => $c->where('name', $like, "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/JobManagement', [
            'postings' => $postings,
            'filters' => ['search' => $search],
            'stats' => [
                'total' => JobPosting::count(),
                'open' => JobPosting::where('status', 'open')->count(),
                'closed' => JobPosting::where('status', 'closed')->count(),
                'draft' => JobPosting::where('status', 'draft')->count(),
            ],
        ]);
    }

    /**
     * Close or reopen any posting, regardless of who owns it.
     */
    public function updateStatus(Request $request, JobPosting $posting): RedirectResponse
    {
        $this->authorize('update', $posting);

        $request->validate(['status' => ['required', 'in:open,closed']]);

        $posting->update(['status' => $request->string('status')->toString()]);

        return back()->with('success', "Job posting marked {$request->string('status')}.");
    }

    /**
     * Remove any posting, regardless of who owns it.
     */
    public function destroy(JobPosting $posting): RedirectResponse
    {
        $this->authorize('delete', $posting);

        $posting->delete();

        return back()->with('success', 'Job posting removed.');
    }
}

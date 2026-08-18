<?php

namespace App\Http\Controllers;

use App\Models\GraduateProfile;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GlobalSearchController extends Controller
{
    /**
     * Global topbar search (Table 5, "Search Bar"). Scoped by the caller's
     * permissions so a graduate never sees admin-only account results and an
     * employer never sees another employer's postings management view.
     */
    public function index(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if (mb_strlen($query) < 2) {
            return response()->json([
                'users' => [],
                'candidates' => [],
                'jobs' => [],
                'surveys' => [],
            ]);
        }

        $user = $request->user();
        $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

        return response()->json([
            'users' => $this->searchUsers($user, $query, $like),
            'candidates' => $this->searchCandidates($user, $query, $like),
            'jobs' => $this->searchJobs($query, $like),
            'surveys' => $this->searchSurveys($user, $query, $like),
        ]);
    }

    private function searchUsers(User $user, string $query, string $like): Collection
    {
        if (! $user->hasPermissionTo('users.manage')) {
            return collect();
        }

        return User::query()
            ->where(function ($q) use ($query, $like) {
                $q->where('first_name', $like, "%{$query}%")
                    ->orWhere('last_name', $like, "%{$query}%")
                    ->orWhere('email', $like, "%{$query}%")
                    ->orWhere('id_number', $like, "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'title' => $u->name,
                'subtitle' => $u->email,
                'url' => route('admin.users.edit', $u),
            ]);
    }

    private function searchCandidates(User $user, string $query, string $like): Collection
    {
        if (! $user->hasPermissionTo('candidates.search')) {
            return collect();
        }

        return GraduateProfile::query()
            ->with('user')
            ->whereHas('user')
            ->where(function ($q) use ($query, $like) {
                $q->where('program', $like, "%{$query}%")
                    ->orWhere('headline', $like, "%{$query}%")
                    ->orWhereHas('user', fn ($u) => $u
                        ->where('first_name', $like, "%{$query}%")
                        ->orWhere('last_name', $like, "%{$query}%")
                        ->orWhereRaw("(first_name || ' ' || last_name) {$like} ?", ["%{$query}%"]));
            })
            ->limit(5)
            ->get()
            ->map(fn (GraduateProfile $g) => [
                'id' => $g->id,
                'title' => $g->user->name,
                'subtitle' => $g->headline ?: $g->program,
                'url' => route('candidates.show', $g),
            ]);
    }

    private function searchJobs(string $query, string $like): Collection
    {
        // The job board is open to every authenticated role, so postings are
        // not gated behind a permission check the way users/candidates are.
        return JobPosting::query()
            ->open()
            ->with('company')
            ->where('title', $like, "%{$query}%")
            ->limit(5)
            ->get()
            ->map(fn (JobPosting $j) => [
                'id' => $j->id,
                'title' => $j->title,
                'subtitle' => $j->company?->name,
                'url' => route('jobs.show', $j),
            ]);
    }

    private function searchSurveys(User $user, string $query, string $like): Collection
    {
        if ($user->hasPermissionTo('surveys.manage')) {
            return Survey::query()
                ->where('title', $like, "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Survey $s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'subtitle' => ucfirst($s->status),
                    'url' => route('surveys.edit', $s),
                ]);
        }

        if ($user->hasPermissionTo('surveys.respond')) {
            return Survey::query()
                ->open()
                ->where('title', $like, "%{$query}%")
                ->limit(5)
                ->get()
                ->map(fn (Survey $s) => [
                    'id' => $s->id,
                    'title' => $s->title,
                    'subtitle' => 'Open',
                    'url' => route('surveys.respond', $s),
                ]);
        }

        return collect();
    }
}

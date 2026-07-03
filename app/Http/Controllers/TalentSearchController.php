<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\GraduateProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TalentSearchController extends Controller
{
    /**
     * Searchable directory of graduate talent for employers.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('candidates.search'), 403);

        $search = trim((string) $request->query('search', ''));
        $collegeId = $request->integer('college') ?: null;
        $withResume = $request->boolean('with_resume');
        $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $candidates = GraduateProfile::query()
            ->with(['user', 'department', 'skills'])
            ->withCount('resumes')
            ->whereHas('user')
            ->when($collegeId, fn ($query) => $query->where('department_id', $collegeId))
            ->when($withResume, fn ($query) => $query->has('resumes'))
            ->when($search, function ($query) use ($search, $like) {
                $query->where(function ($sub) use ($search, $like) {
                    $sub->where('program', $like, "%{$search}%")
                        ->orWhere('headline', $like, "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u
                            ->where('first_name', $like, "%{$search}%")
                            ->orWhere('last_name', $like, "%{$search}%"))
                        ->orWhereHas('skills', fn ($s) => $s->where('name', $like, "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('TalentSearch', [
            'candidates' => $candidates,
            'colleges' => Department::colleges()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'college' => $collegeId,
                'with_resume' => $withResume,
            ],
        ]);
    }
}

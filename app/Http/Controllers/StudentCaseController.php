<?php

namespace App\Http\Controllers;

use App\Models\StudentCase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentCaseController extends Controller
{
    /**
     * Student concerns / case management (FDD SAO "manage student concerns
     * and cases" — a currently-enrolled-student function, distinct from
     * alumni concerns which route through Alumni Affairs). Students file a
     * concern about themselves; SAO manages the queue, assigns, and resolves.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user->hasPermissionTo('students.cases.manage');

        abort_unless($canManage || $user->hasRole('student'), 403);

        if ($canManage) {
            $cases = StudentCase::with(['graduateProfile.user', 'reportedBy', 'assignedTo'])->latest()->get();
        } else {
            $profile = $user->graduateProfile;
            $cases = $profile
                ? StudentCase::where('graduate_profile_id', $profile->id)->latest()->get()
                : collect();
        }

        return Inertia::render('StudentCases', [
            'cases' => $cases,
            'canManage' => $canManage,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole('student'), 403);

        $profile = $request->user()->graduateProfile;
        abort_if($profile === null, 422, 'Complete your profile before filing a concern.');

        $data = $request->validate([
            'category' => ['required', 'in:academic,financial,personal,disciplinary,other'],
            'description' => ['required', 'string'],
        ]);

        StudentCase::create([
            ...$data,
            'graduate_profile_id' => $profile->id,
            'reported_by_user_id' => $request->user()->id,
            'status' => 'open',
        ]);

        return back()->with('success', 'Your concern has been submitted.');
    }

    public function update(Request $request, StudentCase $studentCase): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('students.cases.manage'), 403);

        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
            'assigned_to_user_id' => ['nullable', 'exists:users,id'],
            'resolution_notes' => ['nullable', 'string'],
        ]);

        $studentCase->update($data);

        return back()->with('success', 'Case updated.');
    }
}

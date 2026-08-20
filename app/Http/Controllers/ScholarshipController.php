<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScholarshipRequest;
use App\Models\GraduateProfile;
use App\Models\Scholarship;
use App\Models\ScholarshipRecipient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScholarshipController extends Controller
{
    /**
     * Scholarship programs and recipients (FDD SAO "Scholarships"). SAO
     * institutional oversight tool — the manuscript doesn't list a
     * graduate-facing "apply for scholarship" function, so this stays
     * SAO-managed rather than a public application portal.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        $scholarships = Scholarship::withCount('recipients')
            ->with(['recipients.graduateProfile.user'])
            ->latest()
            ->get();

        return Inertia::render('Scholarships', [
            'scholarships' => $scholarships,
            'totalBudget' => (float) $scholarships->sum('budget_amount'),
            'totalRecipients' => $scholarships->sum('recipients_count'),
            'graduates' => GraduateProfile::with('user')->get()->map(fn (GraduateProfile $p) => [
                'id' => $p->id,
                'name' => $p->user->name,
                'student_number' => $p->student_number,
            ])->values(),
        ]);
    }

    public function store(StoreScholarshipRequest $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        Scholarship::create([...$request->validated(), 'created_by_user_id' => $request->user()->id]);

        return back()->with('success', 'Scholarship added.');
    }

    public function update(StoreScholarshipRequest $request, Scholarship $scholarship): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        $scholarship->update($request->validated());

        return back()->with('success', 'Scholarship updated.');
    }

    public function destroy(Request $request, Scholarship $scholarship): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        $scholarship->delete();

        return back()->with('success', 'Scholarship removed.');
    }

    public function addRecipient(Request $request, Scholarship $scholarship): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        $request->validate(['graduate_profile_id' => ['required', 'exists:graduate_profiles,id']]);

        $scholarship->recipients()->firstOrCreate(
            ['graduate_profile_id' => $request->integer('graduate_profile_id')],
            ['awarded_at' => now()],
        );

        return back()->with('success', 'Recipient added.');
    }

    public function removeRecipient(Request $request, ScholarshipRecipient $recipient): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('scholarships.manage'), 403);

        $recipient->delete();

        return back()->with('success', 'Recipient removed.');
    }
}

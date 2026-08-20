<?php

namespace App\Http\Controllers;

use App\Models\ClearanceRecord;
use App\Models\GraduateProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClearanceController extends Controller
{
    /**
     * Graduation clearance across the 6 fixed offices (FDD SAO
     * "Clearance"). SAO sees institution-wide progress and can update any
     * graduate's checklist; graduates/alumni see only their own, read-only.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasPermissionTo('clearance.manage')) {
            return $this->managerView($request);
        }

        return $this->ownView($user);
    }

    private function managerView(Request $request): Response
    {
        $totalGraduates = GraduateProfile::count();

        $officeProgress = collect(ClearanceRecord::OFFICES)->map(fn (string $office) => [
            'office' => $office,
            'cleared' => ClearanceRecord::where('office', $office)->where('status', 'cleared')->count(),
            'total' => $totalGraduates,
        ])->values();

        $selectedProfileId = $request->integer('graduate_profile_id') ?: null;

        return Inertia::render('Clearance', [
            'mode' => 'manager',
            'officeProgress' => $officeProgress,
            'totalGraduates' => $totalGraduates,
            'graduates' => GraduateProfile::with('user')->get()->map(fn (GraduateProfile $p) => [
                'id' => $p->id, 'name' => $p->user->name, 'student_number' => $p->student_number,
            ])->values(),
            'selectedProfileId' => $selectedProfileId,
            'selectedChecklist' => $selectedProfileId ? $this->checklistFor($selectedProfileId) : null,
        ]);
    }

    private function ownView(User $user): Response
    {
        $profile = $user->graduateProfile;

        return Inertia::render('Clearance', [
            'mode' => 'own',
            'checklist' => $profile
                ? $this->checklistFor($profile->id)
                : collect(ClearanceRecord::OFFICES)->map(fn ($office) => ['office' => $office, 'status' => 'pending', 'cleared_at' => null])->values(),
        ]);
    }

    /**
     * @return Collection<int, array{office: string, status: string, cleared_at: ?string}>
     */
    private function checklistFor(int $profileId): Collection
    {
        $records = ClearanceRecord::where('graduate_profile_id', $profileId)->get()->keyBy('office');

        return collect(ClearanceRecord::OFFICES)->map(fn (string $office) => [
            'office' => $office,
            'status' => $records->get($office)?->status ?? 'pending',
            'cleared_at' => $records->get($office)?->cleared_at,
        ])->values();
    }

    public function updateOffice(Request $request, GraduateProfile $graduateProfile): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('clearance.manage'), 403);

        $data = $request->validate([
            'office' => ['required', Rule::in(ClearanceRecord::OFFICES)],
            'status' => ['required', 'in:pending,cleared'],
        ]);

        ClearanceRecord::updateOrCreate(
            ['graduate_profile_id' => $graduateProfile->id, 'office' => $data['office']],
            [
                'status' => $data['status'],
                'cleared_by_user_id' => $data['status'] === 'cleared' ? $request->user()->id : null,
                'cleared_at' => $data['status'] === 'cleared' ? now() : null,
            ],
        );

        return back()->with('success', 'Clearance updated.');
    }
}

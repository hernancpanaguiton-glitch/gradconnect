<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGraduateProfileRequest;
use App\Jobs\GenerateResumeEmbedding;
use App\Models\Department;
use App\Models\GraduateProfile;
use App\Models\Skill;
use App\Support\UclmCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GraduateProfileController extends Controller
{
    /**
     * Show the profile edit page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->graduateProfile()->firstOrCreate(
            ['user_id' => $user->id],
            ['current_employment_status' => 'unemployed'],
        );
        $profile->load(['educationRecords', 'employmentRecords', 'skills', 'department']);

        $allSkills = Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category', 'slug']);

        $colleges = Department::colleges()
            ->with(['children' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        // Seeded graduates are linked to their PROGRAM, so a college-only
        // dropdown showed them "— Select —" and every save then failed the
        // college rule — including from the Skills tab, where the message was
        // never visible. Send both halves so the form can preselect them.
        $isProgram = $profile->department?->type === 'program';
        $selectedCollegeId = $isProgram ? $profile->department->parent_id : $profile->department_id;
        $selectedProgramId = $isProgram ? $profile->department_id : null;

        $skillCategory = UclmCatalog::skillCategoryForCollegeCode(
            $colleges->firstWhere('id', $selectedCollegeId)?->code
        );

        return Inertia::render('Graduate/ProfileEdit', [
            'profile' => $profile,
            'allSkills' => $allSkills,
            'colleges' => $colleges,
            'selectedCollegeId' => $selectedCollegeId,
            'selectedProgramId' => $selectedProgramId,
            'skillCategory' => $skillCategory,
        ]);
    }

    /**
     * Update the graduate profile.
     */
    public function update(UpdateGraduateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->graduateProfile()->firstOrCreate(['user_id' => $user->id]);

        $this->authorize('update', $profile);

        // safe() rather than except(): the old version fed the raw request in,
        // which let anyone post user_id or student_number straight through.
        $attributes = $request->safe()->except(['skills', 'college_id', 'program_id']);

        $programId = $request->input('program_id');
        $attributes['department_id'] = $programId ?: $request->input('college_id');

        if ($programId !== null) {
            // The free-text program is what résumé/job matching reads, so keep
            // it in step with the program the graduate picked.
            $attributes['program'] = Department::find($programId)?->name ?? ($attributes['program'] ?? null);
        }

        $profile->fill($attributes)->save();

        if ($request->has('skills')) {
            $profile->skills()->sync(
                collect($request->skills)->mapWithKeys(fn ($id) => [$id => ['source' => 'self']])
            );
        }

        $profile->profile_completion = $this->calculateCompletion($profile);
        $profile->save();

        // The résumé embedding blends the profile text, so refresh it when the
        // profile changes to keep future recommendations in sync.
        if ($primaryResume = $profile->primaryResume) {
            GenerateResumeEmbedding::dispatch($primaryResume->id);
        }

        return back()->with('success', 'Profile updated.');
    }

    /**
     * Calculate the profile completion percentage.
     */
    private function calculateCompletion(GraduateProfile $profile): int
    {
        $fields = [
            'program',
            'gender',
            'birthdate',
            'phone',
            'address',
            'city',
            'headline',
            'summary',
            'current_employment_status',
        ];

        $filled = collect($fields)->filter(fn ($field) => ! empty($profile->$field))->count();

        $hasEducation = $profile->educationRecords()->exists();
        $hasEmployment = $profile->employmentRecords()->exists();
        $hasSkills = $profile->skills()->exists();

        $total = count($fields) + 3;
        $completed = $filled + (int) $hasEducation + (int) $hasEmployment + (int) $hasSkills;

        return (int) round(($completed / $total) * 100);
    }
}

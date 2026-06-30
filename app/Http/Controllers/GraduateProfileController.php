<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGraduateProfileRequest;
use App\Models\GraduateProfile;
use App\Models\Skill;
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
        $profile->load(['educationRecords', 'employmentRecords', 'skills']);

        $allSkills = Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category', 'slug']);

        return Inertia::render('Graduate/ProfileEdit', compact('profile', 'allSkills'));
    }

    /**
     * Update the graduate profile.
     */
    public function update(UpdateGraduateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->graduateProfile()->firstOrCreate(['user_id' => $user->id]);

        $this->authorize('update', $profile);

        $profile->fill($request->except('skills'))->save();

        if ($request->has('skills')) {
            $profile->skills()->sync(
                collect($request->skills)->mapWithKeys(fn ($id) => [$id => ['source' => 'self']])
            );
        }

        $profile->profile_completion = $this->calculateCompletion($profile);
        $profile->save();

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

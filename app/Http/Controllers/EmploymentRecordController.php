<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmploymentRecordRequest;
use App\Models\EmploymentRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmploymentRecordController extends Controller
{
    /**
     * Store a new employment record for the authenticated user's profile.
     */
    public function store(StoreEmploymentRecordRequest $request): RedirectResponse
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        $profile->employmentRecords()->create($request->validated());

        return back()->with('success', 'Employment record added.');
    }

    /**
     * Update an existing employment record.
     */
    public function update(StoreEmploymentRecordRequest $request, EmploymentRecord $employment): RedirectResponse
    {
        abort_unless(
            $employment->graduateProfile->user_id === $request->user()->id,
            403,
        );

        $employment->fill($request->validated())->save();

        return back()->with('success', 'Employment record updated.');
    }

    /**
     * Delete an employment record.
     */
    public function destroy(Request $request, EmploymentRecord $employment): RedirectResponse
    {
        abort_unless(
            $employment->graduateProfile->user_id === $request->user()->id,
            403,
        );

        $employment->delete();

        return back()->with('success', 'Employment record removed.');
    }
}

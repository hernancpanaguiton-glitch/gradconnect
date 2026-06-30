<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEducationRecordRequest;
use App\Models\EducationRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EducationRecordController extends Controller
{
    /**
     * Store a new education record for the authenticated user's profile.
     */
    public function store(StoreEducationRecordRequest $request): RedirectResponse
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        $profile->educationRecords()->create($request->validated());

        return back()->with('success', 'Education record added.');
    }

    /**
     * Update an existing education record.
     */
    public function update(StoreEducationRecordRequest $request, EducationRecord $education): RedirectResponse
    {
        abort_unless(
            $education->graduateProfile->user_id === $request->user()->id,
            403,
        );

        $education->fill($request->validated())->save();

        return back()->with('success', 'Education record updated.');
    }

    /**
     * Delete an education record.
     */
    public function destroy(Request $request, EducationRecord $education): RedirectResponse
    {
        abort_unless(
            $education->graduateProfile->user_id === $request->user()->id,
            403,
        );

        $education->delete();

        return back()->with('success', 'Education record removed.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResumeRequest;
use App\Jobs\GenerateResumeEmbedding;
use App\Models\Resume;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ResumeController extends Controller
{
    /**
     * List all resumes for the authenticated user's profile.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile()->with('resumes')->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        return Inertia::render('Graduate/Resumes', [
            'profile' => $profile,
            'resumes' => $profile->resumes,
        ]);
    }

    /**
     * Store a newly uploaded resume.
     */
    public function store(StoreResumeRequest $request): RedirectResponse
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store("resumes/{$profile->id}", 'local');

        $isFirst = ! $profile->resumes()->exists();

        $resume = $profile->resumes()->create([
            'original_filename' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $uploadedFile->getMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'is_primary' => $isFirst,
            'embedding_status' => 'pending',
        ]);

        GenerateResumeEmbedding::dispatch($resume->id);

        return back()->with('success', 'Resume uploaded.');
    }

    /**
     * Delete a resume.
     */
    public function destroy(Request $request, Resume $resume): RedirectResponse
    {
        $this->authorize('delete', $resume);

        Storage::disk('local')->delete($resume->path);
        $resume->delete();

        return back()->with('success', 'Resume deleted.');
    }

    /**
     * Set a resume as the primary resume for the profile.
     */
    public function setPrimary(Request $request, Resume $resume): RedirectResponse
    {
        $this->authorize('setPrimary', $resume);

        $resume->graduateProfile->resumes()->update(['is_primary' => false]);
        $resume->update(['is_primary' => true]);

        return back()->with('success', 'Primary resume updated.');
    }
}

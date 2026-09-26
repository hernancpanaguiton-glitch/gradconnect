<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResumeRequest;
use App\Jobs\GenerateResumeEmbedding;
use App\Models\Resume;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
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
    /**
     * Canonical type per accepted extension, so a .docx is never recorded as
     * the zip container the platform detects.
     *
     * @var array<string, string>
     */
    private const MIME_TYPES = [
        'pdf' => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt' => 'text/plain',
    ];

    public function store(StoreResumeRequest $request): RedirectResponse
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(
            ['user_id' => $request->user()->id],
        );

        $uploadedFile = $request->file('file');

        // store() names the file from the DETECTED type, which turns a .docx
        // into a .zip — and the text extractor picks its parser by extension,
        // so the résumé would import as empty with no error. Keep the client
        // extension we just validated.
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $path = $uploadedFile->storeAs(
            "resumes/{$profile->id}",
            Str::random(40).'.'.$extension,
            'local'
        );

        $isFirst = ! $profile->resumes()->exists();

        $resume = $profile->resumes()->create([
            'original_filename' => $uploadedFile->getClientOriginalName(),
            'path' => $path,
            'mime_type' => self::MIME_TYPES[$extension] ?? $uploadedFile->getMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'is_primary' => $isFirst,
            'source' => 'uploaded',
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

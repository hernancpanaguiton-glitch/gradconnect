<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateResumeEmbedding;
use App\Models\GraduateProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ResumeBuilderController extends Controller
{
    /**
     * Résumé Builder (FR3 Résumé Management; FDD "Build resume"; Appendix C
     * §D "Resume Builder"). Renders the graduate's existing profile data —
     * GraduateProfile::buildProfileText() already assembles it — as a résumé
     * preview they can print/save as PDF from the browser.
     */
    public function index(Request $request): Response
    {
        $profile = $request->user()->graduateProfile()->firstOrCreate(['user_id' => $request->user()->id]);

        // load() rather than with(): firstOrCreate only eager-loads on the
        // branch that finds an existing row, so a graduate opening the builder
        // before their profile exists got a model with none of these relations
        // and the page threw on profile.skills.length.
        $profile->load(['department', 'educationRecords', 'employmentRecords', 'skills']);

        return Inertia::render('Graduate/ResumeBuilder', [
            'profile' => $profile,
        ]);
    }

    /**
     * Turn the current profile into a real Resume row — a plain-text file
     * saved to storage, so it flows through the exact same AI-matching
     * pipeline (GenerateResumeEmbedding reads the file back off disk) as an
     * uploaded résumé, with source='built' as the only distinction.
     */
    public function store(Request $request): RedirectResponse
    {
        $profile = $request->user()->graduateProfile()->with(['educationRecords', 'employmentRecords', 'skills'])
            ->firstOrCreate(['user_id' => $request->user()->id]);

        $profileText = $profile->buildProfileText();

        abort_if(trim($profileText) === '', 422, 'Complete your profile (headline, skills, education, or employment) before building a résumé.');

        $content = $this->formatAsResumeText($request->user(), $profile, $profileText);

        $filename = 'built-'.now()->timestamp.'.txt';
        $path = "resumes/{$profile->id}/{$filename}";
        Storage::disk('local')->put($path, $content);

        $isFirst = ! $profile->resumes()->exists();

        $resume = $profile->resumes()->create([
            'original_filename' => "Resume - {$request->user()->name}.txt",
            'path' => $path,
            'mime_type' => 'text/plain',
            'size_bytes' => strlen($content),
            'is_primary' => $isFirst,
            'source' => 'built',
            'embedding_status' => 'pending',
        ]);

        GenerateResumeEmbedding::dispatch($resume->id);

        return redirect()->route('resumes.index')->with('success', 'Résumé built and saved.');
    }

    private function formatAsResumeText(User $user, GraduateProfile $profile, string $profileText): string
    {
        $contactLine = implode(' | ', array_filter([
            $user->email,
            $profile->phone,
            $profile->city,
            $profile->linkedin_url,
        ]));

        return implode("\n\n", array_filter([
            strtoupper($user->name),
            $contactLine,
            $profileText,
        ]));
    }
}

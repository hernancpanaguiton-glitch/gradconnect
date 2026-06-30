<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobPostingRequest;
use App\Models\Company;
use App\Models\JobPosting;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobPostingController extends Controller
{
    /**
     * List the industry partner's own job postings.
     */
    public function index(Request $request): Response
    {
        $company = Company::where('owner_user_id', $request->user()->id)->firstOrFail();

        $postings = $company->jobPostings()
            ->withCount('applications')
            ->latest()
            ->paginate(20);

        return Inertia::render('Postings/Index', [
            'company' => $company,
            'postings' => $postings,
        ]);
    }

    /**
     * Show the create job posting form.
     */
    public function create(): Response
    {
        $this->authorize('create', JobPosting::class);

        $skills = Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category', 'slug']);

        return Inertia::render('Postings/Create', [
            'skills' => $skills,
        ]);
    }

    /**
     * Store a new job posting.
     */
    public function store(StoreJobPostingRequest $request): RedirectResponse
    {
        $this->authorize('create', JobPosting::class);

        $company = Company::where('owner_user_id', $request->user()->id)->firstOrFail();

        $posting = $company->jobPostings()->create([
            ...$request->except('skills'),
            'posted_by_user_id' => $request->user()->id,
        ]);

        if ($request->has('skills')) {
            $skillPivot = collect($request->skills)->mapWithKeys(
                fn ($skill) => [
                    $skill['id'] => [
                        'is_required' => $skill['is_required'] ?? false,
                        'weight' => $skill['weight'] ?? 3,
                    ],
                ]
            );
            $posting->skills()->sync($skillPivot);
        }

        return redirect()->route('postings.index')->with('success', 'Job posting created.');
    }

    /**
     * Show the edit form for a job posting.
     */
    public function edit(JobPosting $posting): Response
    {
        $this->authorize('update', $posting);

        $posting->load('skills');
        $skills = Skill::orderBy('category')->orderBy('name')->get(['id', 'name', 'category', 'slug']);

        return Inertia::render('Postings/Edit', [
            'posting' => $posting,
            'skills' => $skills,
        ]);
    }

    /**
     * Update a job posting.
     */
    public function update(StoreJobPostingRequest $request, JobPosting $posting): RedirectResponse
    {
        $this->authorize('update', $posting);

        $posting->fill($request->except('skills'))->save();

        if ($request->has('skills')) {
            $skillPivot = collect($request->skills)->mapWithKeys(
                fn ($skill) => [
                    $skill['id'] => [
                        'is_required' => $skill['is_required'] ?? false,
                        'weight' => $skill['weight'] ?? 3,
                    ],
                ]
            );
            $posting->skills()->sync($skillPivot);
        }

        return back()->with('success', 'Job posting updated.');
    }

    /**
     * Delete a job posting.
     */
    public function destroy(JobPosting $posting): RedirectResponse
    {
        $this->authorize('delete', $posting);

        $posting->delete();

        return redirect()->route('postings.index')->with('success', 'Job posting deleted.');
    }

    /**
     * Show candidates who applied to a job posting.
     */
    public function candidates(Request $request, JobPosting $posting): Response
    {
        abort_unless(
            $posting->posted_by_user_id === $request->user()->id
                || $request->user()->hasPermissionTo('job_postings.moderate'),
            403,
        );

        $applications = $posting->applications()
            ->with(['graduateProfile.user', 'resume'])
            ->latest()
            ->paginate(30);

        return Inertia::render('Postings/Candidates', [
            'posting' => $posting,
            'applications' => $applications,
        ]);
    }

    /**
     * Public job board — list all open postings.
     */
    public function publicIndex(Request $request): Response
    {
        $query = JobPosting::open()
            ->with(['company', 'skills'])
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($employmentType = $request->input('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        if ($request->boolean('is_remote')) {
            $query->where('is_remote', true);
        }

        $postings = $query->paginate(20)->withQueryString();

        return Inertia::render('Jobs/Index', [
            'postings' => $postings,
            'filters' => $request->only(['search', 'employment_type', 'is_remote']),
        ]);
    }

    /**
     * Show a single job posting detail page.
     */
    public function show(Request $request, JobPosting $posting): Response
    {
        $posting->load(['company', 'skills']);

        $userApplication = null;
        $userProfile = $request->user()->graduateProfile;

        if ($userProfile) {
            $userApplication = $posting->applications()
                ->where('graduate_profile_id', $userProfile->id)
                ->first();
        }

        return Inertia::render('Jobs/Show', [
            'posting' => $posting,
            'userApplication' => $userApplication,
        ]);
    }
}

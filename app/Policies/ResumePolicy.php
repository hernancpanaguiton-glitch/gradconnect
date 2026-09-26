<?php

namespace App\Policies;

use App\Models\JobApplication;
use App\Models\Resume;
use App\Models\User;

class ResumePolicy
{
    /**
     * Whether this viewer may read the résumé FILE (and therefore see a
     * download link for it).
     *
     * The file is the sensitive artefact, so unlike profile browsing — which
     * Talent Search legitimately opens up — this additionally requires a
     * relationship: an employer may only read the résumé of someone who
     * actually applied to one of their own postings. Institution-wide roles
     * (SAO, AAO, Admin, anyone holding graduate_profiles.view_all) keep full
     * access for tracer/records work.
     *
     * Lives here rather than in CandidateController so the file route and the
     * presenter that renders the link answer the question the same way —
     * previously the UI offered links that then 403'd.
     */
    public function download(User $user, Resume $resume): bool
    {
        if ($user->id === $resume->graduateProfile?->user_id) {
            return true;
        }

        if (! $user->hasPermissionTo('candidates.view_resumes')) {
            return false;
        }

        if ($user->hasPermissionTo('graduate_profiles.view_all')) {
            return true;
        }

        return JobApplication::where('graduate_profile_id', $resume->graduate_profile_id)
            ->whereHas('jobPosting', fn ($query) => $query
                ->where('posted_by_user_id', $user->id)
                ->orWhereHas('company', fn ($c) => $c->where('owner_user_id', $user->id))
            )
            ->exists();
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Resume $resume): bool
    {
        return $user->id === $resume->graduateProfile->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Resume $resume): bool
    {
        return $user->id === $resume->graduateProfile->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Resume $resume): bool
    {
        return $user->id === $resume->graduateProfile->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Resume $resume): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Resume $resume): bool
    {
        return false;
    }

    /**
     * Determine whether the user can set this resume as primary.
     */
    public function setPrimary(User $user, Resume $resume): bool
    {
        return $user->id === $resume->graduateProfile->user_id;
    }
}

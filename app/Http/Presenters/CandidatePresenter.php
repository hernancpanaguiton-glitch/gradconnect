<?php

namespace App\Http\Presenters;

use App\Models\GraduateProfile;
use App\Models\JobApplication;
use App\Models\JobMatchResult;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Explicit whitelists for every employer-facing view of a graduate.
 *
 * These pages used to serialize whole GraduateProfile / Resume / User models,
 * so an industry partner browsing Talent Search received birthdate, gender,
 * phone, address, student_number, the user's id_number and the résumé's full
 * extracted text — none of which any of these screens render. Listing the
 * fields here means adding a column to a table no longer widens what
 * employers can read.
 *
 * Email is the one contact detail an employer has a legitimate need for, and
 * only once there is a relationship: they hold graduate_profiles.view_all
 * (institutional roles), or the graduate applied to one of their postings.
 */
class CandidatePresenter
{
    /**
     * Graduate profile IDs that have applied to one of the viewer's own
     * postings. Memoized: bounded by the viewer's own application volume,
     * and resolving it per row would be an N+1 on the search results.
     *
     * @var Collection<int, int>|null
     */
    private ?Collection $applicantProfileIds = null;

    public function __construct(private readonly User $viewer) {}

    /**
     * A search result card (Talent Search). No contact details at all —
     * the card shows a name, a headline and skills.
     *
     * @return array<string, mixed>
     */
    public function card(GraduateProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'program' => $profile->program,
            'headline' => $profile->headline,
            'city' => $profile->city,
            'resumes_count' => $profile->resumes_count ?? 0,
            'user' => ['name' => $profile->user?->name],
            'department' => $this->department($profile),
            'skills' => $this->skills($profile),
        ];
    }

    /**
     * The full read-only profile view (candidate page + quick-view modal).
     *
     * @return array<string, mixed>
     */
    public function detail(GraduateProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'program' => $profile->program,
            'headline' => $profile->headline,
            'summary' => $profile->summary,
            'city' => $profile->city,
            'linkedin_url' => $profile->linkedin_url,
            'current_employment_status' => $profile->current_employment_status,
            'willing_to_relocate' => (bool) $profile->willing_to_relocate,
            'user' => $this->user($profile),
            'department' => $this->department($profile),
            'skills' => $this->skills($profile),
            'education_records' => $profile->educationRecords->map(fn ($record) => [
                'id' => $record->id,
                'institution' => $record->institution,
                'degree' => $record->degree,
                'field_of_study' => $record->field_of_study,
                'start_year' => $record->start_year,
                'end_year' => $record->end_year,
                'honors' => $record->honors,
            ])->values()->all(),
            'employment_records' => $profile->employmentRecords->map(fn ($record) => [
                'id' => $record->id,
                'company_name' => $record->company_name,
                'job_title' => $record->job_title,
                'employment_type' => $record->employment_type,
                'is_current' => $record->is_current,
                'start_date' => $record->start_date,
                'end_date' => $record->end_date,
            ])->values()->all(),
            'resumes' => $profile->resumes->map(fn (Resume $resume) => $this->resume($resume))->values()->all(),
        ];
    }

    /**
     * One row of a posting's applicant list.
     *
     * @return array<string, mixed>
     */
    public function applicant(JobApplication $application): array
    {
        $profile = $application->graduateProfile;
        $feedback = $application->employerFeedback;

        return [
            'id' => $application->id,
            'status' => $application->status,
            'applied_at' => $application->applied_at,
            'cover_letter' => $application->cover_letter,
            'graduate_profile' => [
                'id' => $profile?->id,
                'current_employment_status' => $profile?->current_employment_status,
                'user' => $profile ? $this->user($profile) : ['name' => null],
                'department' => $profile ? $this->department($profile) : null,
            ],
            'resume' => $application->resume ? $this->resume($application->resume) : null,
            'employer_feedback' => $feedback ? [
                'id' => $feedback->id,
                'overall_rating' => $feedback->overall_rating,
                'competency_ratings' => $feedback->competency_ratings,
                'comments' => $feedback->comments,
            ] : null,
        ];
    }

    /**
     * One AI-ranked candidate. Matching is a shortlist the employer has not
     * engaged with yet, so no email here at all — they reach a candidate by
     * opening the profile, which applies the same relationship rule.
     *
     * @return array<string, mixed>
     */
    public function match(JobMatchResult $match): array
    {
        $profile = $match->graduateProfile;

        return [
            'id' => $match->id,
            'graduate_profile_id' => $match->graduate_profile_id,
            'similarity' => $match->similarity,
            'fit_score' => $match->fit_score,
            'explanation' => $match->explanation,
            'skill_gaps' => $match->skill_gaps,
            'matched_skills' => $match->matched_skills,
            'recommendation' => $match->recommendation,
            'graduate_profile' => [
                'id' => $profile?->id,
                'headline' => $profile?->headline,
                'user' => ['name' => $profile?->user?->name],
            ],
            'resume' => $match->resume ? $this->resume($match->resume) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resume(Resume $resume): array
    {
        return [
            'id' => $resume->id,
            'original_filename' => $resume->original_filename,
            'is_primary' => (bool) $resume->is_primary,
            'size_bytes' => $resume->size_bytes,
            // Drives whether a download link is rendered, using the same rule
            // the file route enforces, so a link is never offered that 403s.
            'can_download' => $this->viewer->can('download', $resume),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function user(GraduateProfile $profile): array
    {
        $user = ['name' => $profile->user?->name];

        if ($this->maySeeEmail($profile)) {
            $user['email'] = $profile->user?->email;
        }

        return $user;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function department(GraduateProfile $profile): ?array
    {
        return $profile->department
            ? ['id' => $profile->department->id, 'name' => $profile->department->name]
            : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function skills(GraduateProfile $profile): array
    {
        return $profile->skills
            ->map(fn ($skill) => ['id' => $skill->id, 'name' => $skill->name])
            ->values()
            ->all();
    }

    private function maySeeEmail(GraduateProfile $profile): bool
    {
        if ($this->viewer->hasPermissionTo('graduate_profiles.view_all')) {
            return true;
        }

        return $this->applicantProfileIds()->contains($profile->id);
    }

    /**
     * @return Collection<int, int>
     */
    private function applicantProfileIds(): Collection
    {
        return $this->applicantProfileIds ??= JobApplication::query()
            ->whereHas('jobPosting', fn ($query) => $query
                ->where('posted_by_user_id', $this->viewer->id)
                ->orWhereHas('company', fn ($c) => $c->where('owner_user_id', $this->viewer->id))
            )
            ->distinct()
            ->pluck('graduate_profile_id');
    }
}

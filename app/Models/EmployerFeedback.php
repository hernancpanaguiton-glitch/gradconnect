<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerFeedback extends Model
{
    use HasFactory;

    /**
     * Laravel's pluralizer treats "Feedback" as uncountable, so the implicit
     * table name would resolve to 'employer_feedback' (singular) — the
     * migration created 'employer_feedbacks' (plural), so this must be explicit.
     */
    protected $table = 'employer_feedbacks';

    protected $fillable = [
        'company_id', 'job_application_id', 'graduate_profile_id',
        'submitted_by_user_id', 'competency_ratings', 'overall_rating', 'comments',
    ];

    protected function casts(): array
    {
        return ['competency_ratings' => 'array'];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }
}

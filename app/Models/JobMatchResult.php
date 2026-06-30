<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobMatchResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_posting_id', 'graduate_profile_id', 'resume_id',
        'similarity', 'fit_score', 'explanation', 'skill_gaps',
        'matched_skills', 'recommendation', 'scored_by', 'scored_at',
    ];

    protected function casts(): array
    {
        return [
            'similarity' => 'float',
            'fit_score' => 'integer',
            'skill_gaps' => 'array',
            'matched_skills' => 'array',
            'scored_at' => 'datetime',
        ];
    }

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }

    public function resume(): BelongsTo
    {
        return $this->belongsTo(Resume::class);
    }
}

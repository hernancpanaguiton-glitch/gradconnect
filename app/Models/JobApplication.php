<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_posting_id', 'graduate_profile_id', 'resume_id',
        'cover_letter', 'status', 'applied_at',
    ];

    protected function casts(): array
    {
        return ['applied_at' => 'datetime'];
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

    public function employerFeedback(): HasOne
    {
        return $this->hasOne(EmployerFeedback::class);
    }
}

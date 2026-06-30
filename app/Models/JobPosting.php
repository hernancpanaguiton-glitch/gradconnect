<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    protected $fillable = [
        'company_id', 'posted_by_user_id', 'title', 'description',
        'responsibilities', 'qualifications', 'employment_type', 'location',
        'is_remote', 'salary_range', 'experience_level', 'min_education',
        'status', 'application_deadline', 'embedding_status', 'embedded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_remote' => 'boolean',
            'application_deadline' => 'date',
            'embedded_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by_user_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'job_posting_skill')
            ->withPivot('is_required', 'weight')
            ->withTimestamps();
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    /** @return string[] */
    public function requiredSkillNames(): array
    {
        return $this->skills()->wherePivot('is_required', true)->pluck('name')->all();
    }

    public function buildEmbeddingText(): string
    {
        return implode("\n\n", array_filter([
            "Job Title: {$this->title}",
            "Employment Type: {$this->employment_type}",
            $this->description,
            $this->responsibilities ? "Responsibilities:\n{$this->responsibilities}" : null,
            $this->qualifications ? "Qualifications:\n{$this->qualifications}" : null,
        ]));
    }

    public function markEmbedded(): void
    {
        $this->update(['embedding_status' => 'done', 'embedded_at' => now()]);
    }

    public function markFailed(): void
    {
        $this->update(['embedding_status' => 'failed']);
    }
}

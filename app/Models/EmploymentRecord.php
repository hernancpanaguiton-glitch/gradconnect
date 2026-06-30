<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploymentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'graduate_profile_id', 'company_name', 'industry', 'job_title',
        'employment_type', 'is_current', 'start_date', 'end_date',
        'monthly_salary_range', 'location', 'is_related_to_course',
        'how_obtained', 'description',
    ];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'is_related_to_course' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_current', true);
    }
}

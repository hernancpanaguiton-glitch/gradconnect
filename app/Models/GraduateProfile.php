<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GraduateProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'department_id', 'program', 'student_number',
        'graduation_year', 'expected_graduation_year', 'gender', 'birthdate',
        'phone', 'address', 'city', 'linkedin_url', 'headline', 'summary',
        'current_employment_status', 'willing_to_relocate', 'profile_completion',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'willing_to_relocate' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function educationRecords(): HasMany
    {
        return $this->hasMany(EducationRecord::class);
    }

    public function employmentRecords(): HasMany
    {
        return $this->hasMany(EmploymentRecord::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'graduate_skill')
            ->withPivot('proficiency', 'source')
            ->withTimestamps();
    }

    public function resumes(): HasMany
    {
        return $this->hasMany(Resume::class);
    }

    public function primaryResume(): HasOne
    {
        return $this->hasOne(Resume::class)->where('is_primary', true)->latestOfMany();
    }

    public function jobApplications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function employerFeedbacks(): HasMany
    {
        return $this->hasMany(EmployerFeedback::class);
    }

    public function matchResults(): HasMany
    {
        return $this->hasMany(JobMatchResult::class);
    }

    public function currentEmployment(): HasOne
    {
        return $this->hasOne(EmploymentRecord::class)->where('is_current', true)->latestOfMany();
    }

    /** @return string[] */
    public function skillNames(): array
    {
        return $this->skills->pluck('name')->all();
    }
}

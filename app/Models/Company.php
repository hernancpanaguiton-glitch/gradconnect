<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_user_id', 'name', 'industry', 'website',
        'description', 'location', 'logo_path', 'is_verified',
    ];

    protected function casts(): array
    {
        return ['is_verified' => 'boolean'];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function jobPostings(): HasMany
    {
        return $this->hasMany(JobPosting::class);
    }

    public function employerFeedbacks(): HasMany
    {
        return $this->hasMany(EmployerFeedback::class);
    }
}

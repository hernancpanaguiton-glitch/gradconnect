<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'id_number',
        'email',
        'password',
        'status',
        'department_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function isGraduate(): bool
    {
        return $this->hasRole(['alumni', 'student']);
    }

    public function isStaff(): bool
    {
        return $this->hasRole(['alumni_affairs', 'department_head', 'admin']);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function graduateProfile(): HasOne
    {
        return $this->hasOne(GraduateProfile::class);
    }

    public function company(): HasOne
    {
        return $this->hasOne(Company::class, 'owner_user_id');
    }

    public function surveyResponses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function createdSurveys(): HasMany
    {
        return $this->hasMany(Survey::class, 'created_by_user_id');
    }
}

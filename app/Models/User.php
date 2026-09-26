<?php

namespace App\Models;

use App\Support\Roles;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * Office roles, as opposed to graduates and employers. Kept in step with
     * the shared vocabulary: 'sao' was missing from the hard-coded list
     * isStaff() used, so a graduate messaging the Student Affairs Office got
     * a 403 from a recipient MessageController had just offered them.
     *
     * @var array<int, string>
     */
    public const STAFF_ROLES = Roles::STAFF;

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

    /**
     * Always expose the computed full name so it is present on serialized
     * relations (e.g. a candidate's user in an applicant list), not just
     * where it is built by hand.
     *
     * @var array<int, string>
     */
    protected $appends = ['name'];

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
        return $this->hasRole(self::STAFF_ROLES);
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

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('last_read_at')
            ->withTimestamps();
    }

    public function matchFeedback(): HasMany
    {
        return $this->hasMany(MatchFeedback::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    /**
     * Whether this user still wants a given notification category. Absence of
     * a row means "not yet configured", which defaults to on — so existing
     * users keep receiving what they always did.
     */
    public function wantsNotification(string $key): bool
    {
        return $this->notificationPreferences
            ->firstWhere('preference_key', $key)
            ?->enabled ?? true;
    }

    /**
     * A department head's analytics scope: their own department plus its
     * child programs (e.g. a college head sees every program under that
     * college). Empty if they have no department assigned.
     *
     * @return array<int, int>
     */
    public function scopedDepartmentIds(): array
    {
        if ($this->department_id === null) {
            return [];
        }

        return Department::expandToProgramIds($this->department_id);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Survey extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id', 'title', 'description', 'type',
        'target_role', 'target_graduation_year', 'status', 'opens_at', 'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Restrict a survey listing to what one respondent should see: no role
     * targeting (open to everyone), or their role/graduation year matches.
     * This is what makes target_role/target_graduation_year do something —
     * they were previously stored but never read anywhere.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        $profile = $user->graduateProfile;
        $year = $profile?->graduation_year ?? $profile?->expected_graduation_year;

        return $query
            ->where(function (Builder $q) use ($user) {
                $q->whereNull('target_role')->orWhereIn('target_role', $user->getRoleNames());
            })
            ->where(function (Builder $q) use ($year) {
                $q->whereNull('target_graduation_year');
                if ($year !== null) {
                    $q->orWhere('target_graduation_year', $year);
                }
            });
    }

    /**
     * Active users this survey should be distributed to: respondent roles
     * only (survey managers are excluded — they administer surveys, they
     * don't answer them), narrowed by target_role/target_graduation_year.
     *
     * @return Collection<int, User>
     */
    public function eligibleRespondents(): Collection
    {
        return User::where('status', 'active')
            ->when($this->target_role, fn (Builder $q) => $q->role($this->target_role))
            ->with(['graduateProfile', 'notificationPreferences'])
            ->get()
            ->reject(fn (User $u) => $u->hasPermissionTo('surveys.manage'))
            ->filter(function (User $u) {
                if ($this->target_graduation_year === null) {
                    return true;
                }

                $profile = $u->graduateProfile;
                $year = $profile?->graduation_year ?? $profile?->expected_graduation_year;

                return $year === $this->target_graduation_year;
            })
            ->values();
    }
}

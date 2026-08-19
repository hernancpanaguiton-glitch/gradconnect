<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id', 'title', 'body', 'audience', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    /**
     * Published announcements visible to a given role (or targeted at everyone).
     */
    public function scopeForRole(Builder $query, ?string $role): Builder
    {
        return $query->published()->where(function (Builder $q) use ($role) {
            $q->whereNull('audience');
            if ($role !== null) {
                $q->orWhere('audience', $role);
            }
        });
    }

    /**
     * Active users this announcement should notify: everyone if the
     * audience is null, otherwise just the targeted role.
     *
     * @return \Illuminate\Support\Collection<int, User>
     */
    public function notifiableUsers(): \Illuminate\Support\Collection
    {
        $query = $this->audience
            ? User::role($this->audience)
            : User::query();

        return $query->where('status', 'active')->get();
    }
}

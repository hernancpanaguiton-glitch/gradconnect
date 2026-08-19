<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LearningResource extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id', 'department_id', 'title', 'type', 'provider', 'url', 'description',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'learning_resource_skill')->withTimestamps();
    }

    /**
     * General-audience resources, or ones scoped to a specific department.
     */
    public function scopeForDepartment(Builder $query, ?int $departmentId): Builder
    {
        return $query->where(function (Builder $q) use ($departmentId) {
            $q->whereNull('department_id');
            if ($departmentId !== null) {
                $q->orWhere('department_id', $departmentId);
            }
        });
    }
}

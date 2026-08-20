<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'type', 'parent_id'];

    /**
     * Scope to top-level colleges (as opposed to their child programs).
     */
    public function scopeColleges(Builder $query): Builder
    {
        return $query->where('type', 'college');
    }

    /**
     * A department ID plus its child program IDs, if it has any (a college
     * expands to include every program under it; a program with no
     * children just returns itself). Shared by User::scopedDepartmentIds()
     * and report filtering (college_id → its programs too).
     *
     * @return array<int, int>
     */
    public static function expandToProgramIds(int $departmentId): array
    {
        $childIds = static::where('parent_id', $departmentId)->pluck('id')->all();

        return array_merge([$departmentId], $childIds);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}

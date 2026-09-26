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
     * Scope to programs (the degree courses under a college).
     */
    public function scopePrograms(Builder $query): Builder
    {
        return $query->where('type', 'program');
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

    /**
     * Every department in this one's branch of the tree: itself, the college
     * above it when it is a program, and the programs below it when it is a
     * college. Content attached anywhere in that branch is relevant to
     * someone sitting at this department.
     *
     * @return array<int, int>
     */
    public static function lineageIds(int $id): array
    {
        $department = static::find($id);

        if ($department === null) {
            return [$id];
        }

        $ids = array_merge(
            [$department->id],
            $department->parent_id === null ? [] : [$department->parent_id],
            static::where('parent_id', $department->id)->pluck('id')->all(),
        );

        return array_values(array_unique($ids));
    }

    /**
     * Records that would be orphaned by deleting this department, as
     * "3 graduate profiles"-style counts. An empty array means it is safe to
     * remove.
     *
     * @return array<string, int>
     */
    public function deletionBlockers(): array
    {
        return array_filter([
            'users' => $this->users()->count(),
            'graduate profiles' => $this->graduateProfiles()->count(),
            'learning resources' => $this->learningResources()->count(),
            'programs' => $this->children()->count(),
        ]);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function graduateProfiles(): HasMany
    {
        return $this->hasMany(GraduateProfile::class);
    }

    public function learningResources(): HasMany
    {
        return $this->hasMany(LearningResource::class);
    }
}

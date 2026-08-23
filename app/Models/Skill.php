<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'category'];

    public function aliases(): HasMany
    {
        return $this->hasMany(SkillAlias::class);
    }

    /**
     * Skill standardization (AI architecture Layer 2.4): resolve a raw name
     * to its canonical Skill via an exact name match first, then a
     * registered alias (e.g. "JS" -> "JavaScript"), before falling back to
     * creating a brand-new skill. This is what makes findOrCreateByName()
     * skill-taxonomy-aware instead of purely slug-literal.
     */
    public static function findOrCreateByName(string $name): self
    {
        $slug = Str::slug($name);

        $existing = static::where('slug', $slug)->first();
        if ($existing !== null) {
            return $existing;
        }

        $alias = SkillAlias::where('alias_slug', $slug)->first();
        if ($alias !== null) {
            return $alias->skill;
        }

        return static::create(['name' => $name, 'slug' => $slug]);
    }

    public function graduates(): BelongsToMany
    {
        return $this->belongsToMany(GraduateProfile::class, 'graduate_skill')
            ->withPivot('proficiency', 'source')
            ->withTimestamps();
    }

    public function jobPostings(): BelongsToMany
    {
        return $this->belongsToMany(JobPosting::class, 'job_posting_skill')
            ->withPivot('is_required', 'weight')
            ->withTimestamps();
    }
}

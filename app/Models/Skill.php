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
     * Slug for a skill name, keeping the symbols that carry the meaning.
     *
     * Str::slug() alone drops them, so "C", "C++" and "C#" all collapsed to
     * "c" — the second of them silently resolved to the first everywhere
     * matching compares slugs. Spelling the symbols out keeps each distinct
     * while leaving ordinary names ("Vue.js", "Tailwind CSS") untouched.
     */
    public static function slugFor(string $name): string
    {
        $slug = Str::slug(
            str($name)
                ->replace('+', ' plus ')
                ->replace('#', ' sharp ')
                // Only a leading or space-preceded dot is part of the name
                // (".NET"); the one in "Vue.js" is not.
                ->replaceMatches('/(^|\s)\.(?=\S)/', '$1dot ')
                ->squish()
                ->value()
        );

        if ($slug !== '') {
            return $slug;
        }

        // A name with no Latin characters at all slugs to an empty string,
        // which the unique index would reject for the second such skill.
        return 'skill-'.substr(hash('sha256', mb_strtolower(trim($name))), 0, 12);
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
        $slug = static::slugFor($name);

        $existing = static::where('slug', $slug)->first();
        if ($existing !== null) {
            return $existing;
        }

        $alias = SkillAlias::where('alias_slug', $slug)->first();
        if ($alias !== null) {
            return $alias->skill;
        }

        // Rows seeded before slugFor() existed can carry a different slug for
        // this very name, so check the name too — otherwise the create below
        // would violate the unique name index instead of reusing the row.
        $sameName = static::whereRaw('LOWER(name) = ?', [mb_strtolower(trim($name))])->first();
        if ($sameName !== null) {
            return $sameName;
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

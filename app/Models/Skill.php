<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'category'];

    public static function findOrCreateByName(string $name): self
    {
        $slug = Str::slug($name);

        return static::firstOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'slug' => $slug]
        );
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

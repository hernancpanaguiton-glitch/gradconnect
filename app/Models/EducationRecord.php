<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EducationRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'graduate_profile_id', 'institution', 'degree',
        'field_of_study', 'start_year', 'end_year', 'honors',
    ];

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }
}

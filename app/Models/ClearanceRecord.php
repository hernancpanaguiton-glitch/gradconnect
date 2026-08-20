<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClearanceRecord extends Model
{
    use HasFactory;

    /**
     * The fixed set of offices a graduate must clear, matching the
     * storyboard's own sample checklist (Clearance page).
     */
    public const OFFICES = [
        'library', 'accounting', 'registrar', 'department', 'student_affairs', 'alumni_office',
    ];

    protected $fillable = [
        'graduate_profile_id', 'office', 'status', 'cleared_by_user_id', 'cleared_at',
    ];

    protected function casts(): array
    {
        return ['cleared_at' => 'datetime'];
    }

    public function graduateProfile(): BelongsTo
    {
        return $this->belongsTo(GraduateProfile::class);
    }

    public function clearedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cleared_by_user_id');
    }
}

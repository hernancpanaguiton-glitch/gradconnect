<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchFeedback extends Model
{
    protected $table = 'match_feedback';

    protected $fillable = ['job_match_result_id', 'user_id', 'rating'];

    public function jobMatchResult(): BelongsTo
    {
        return $this->belongsTo(JobMatchResult::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

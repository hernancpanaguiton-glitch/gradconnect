<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'description', 'ip_address'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a security-relevant action (Fig. 15 "System Logs & Audit
     * Trail"). Kept to auth events and admin account/role changes rather
     * than every model touch, so the log stays signal, not noise.
     */
    public static function record(string $action, ?User $actor = null, ?string $description = null): self
    {
        return static::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'description' => $description,
            'ip_address' => app(Request::class)->ip(),
        ]);
    }
}

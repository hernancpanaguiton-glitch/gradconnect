<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = ['user_id', 'preference_key', 'enabled'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }

    /**
     * The user-controllable notification categories. Each maps to a real
     * notification class — there is deliberately no toggle for account
     * approval / pending-approval, which are transactional security mail a
     * user should not be able to silence.
     *
     * @var array<string, array{label: string, description: string}>
     */
    public const KEYS = [
        'application_updates' => [
            'label' => 'Application Updates',
            'description' => 'Status changes on jobs you applied to',
        ],
        'application_received' => [
            'label' => 'New Applicants',
            'description' => 'When a graduate applies to one of your postings',
        ],
        'survey_invitations' => [
            'label' => 'Survey Invitations',
            'description' => 'Tracer and employability survey invites and reminders',
        ],
        'announcements' => [
            'label' => 'Announcements',
            'description' => 'Announcements from the university offices',
        ],
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

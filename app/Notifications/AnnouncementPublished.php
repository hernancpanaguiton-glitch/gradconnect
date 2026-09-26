<?php

namespace App\Notifications;

use App\Models\Announcement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class AnnouncementPublished extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Announcement $announcement) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable->wantsNotification('announcements') ? ['database', 'mail'] : [];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->theme('gradconnect')
            ->subject("Announcement: {$this->announcement->title}")
            ->greeting('Hello!')
            ->line($this->announcement->title)
            ->line('Open GradConnect to read the full announcement.')
            ->action('View announcements', url('/notifications'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'announcement',
            'title' => 'Announcement: '.$this->announcement->title,
            'message' => Str::limit($this->announcement->body, 140),
            'url' => '/notifications',
        ];
    }
}

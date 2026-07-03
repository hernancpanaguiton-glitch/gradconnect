<?php

namespace App\Notifications;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ApplicationStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public JobApplication $application) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = $this->application->jobPosting->title;

        return (new MailMessage)
            ->theme('gradconnect')
            ->subject("Update on your application: {$title}")
            ->greeting('Hello!')
            ->line("Your application for {$title} is now: {$this->statusLabel()}.")
            ->action('View your applications', url('/applications'))
            ->line('Good luck!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'application_status',
            'title' => 'Application update',
            'message' => "Your application for {$this->application->jobPosting->title} is now {$this->statusLabel()}.",
            'url' => '/applications',
        ];
    }

    private function statusLabel(): string
    {
        return Str::headline($this->application->status);
    }
}

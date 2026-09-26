<?php

namespace App\Notifications;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public JobApplication $application) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable->wantsNotification('application_received') ? ['database', 'mail'] : [];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = $this->application->jobPosting->title;

        // The applicant's name stays out of email and lives in the in-app
        // notification instead, behind the sign-in.
        return (new MailMessage)
            ->theme('gradconnect')
            ->subject("New application: {$title}")
            ->greeting('Hello!')
            ->line("A candidate has applied to your posting for {$title}.")
            ->action('Review candidates', url("/postings/{$this->application->job_posting_id}/candidates"))
            ->line('Thank you for using GradConnect.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'application_received',
            'title' => 'New job application',
            'message' => "{$this->application->graduateProfile->user->name} applied to {$this->application->jobPosting->title}.",
            'url' => "/postings/{$this->application->job_posting_id}/candidates",
        ];
    }
}

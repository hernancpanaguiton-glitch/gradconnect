<?php

namespace App\Notifications;

use App\Models\Survey;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SurveyInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Survey $survey, public bool $isReminder = false) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable->wantsNotification('survey_invitations') ? ['database', 'mail'] : [];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->theme('gradconnect')
            ->subject(($this->isReminder ? 'Reminder: ' : '').$this->survey->title)
            ->greeting('Hello!')
            ->line($this->isReminder
                ? "This is a reminder to complete the \"{$this->survey->title}\" survey."
                : "You're invited to complete the \"{$this->survey->title}\" survey.");

        // The description is free text written by staff, so it is read in the
        // app rather than copied into an email.
        return $mail->action('Respond now', url("/surveys/{$this->survey->id}/respond"));
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'survey_invitation',
            'title' => $this->isReminder ? "Reminder: {$this->survey->title}" : "New survey: {$this->survey->title}",
            'message' => $this->isReminder
                ? "Please complete the \"{$this->survey->title}\" survey if you haven't already."
                : "You have a new survey to complete: {$this->survey->title}.",
            'url' => "/surveys/{$this->survey->id}/respond",
        ];
    }
}

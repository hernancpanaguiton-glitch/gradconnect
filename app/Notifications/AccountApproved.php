<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountApproved extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->theme('gradconnect')
            ->subject('Your GradConnect account has been approved')
            ->greeting("Welcome, {$notifiable->first_name}!")
            ->line('An administrator has approved your account. You can now sign in to GradConnect.')
            ->action('Sign in', url('/login'))
            ->line('We’re glad to have you on board.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'account_approved',
            'title' => 'Account approved',
            'message' => 'Your account has been approved. Welcome to GradConnect!',
            'url' => '/dashboard',
        ];
    }
}

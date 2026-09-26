<?php

namespace App\Notifications;

use App\Models\User;
use App\Support\Roles;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewAccountPendingApproval extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $pendingUser) {}

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
            ->subject('New account awaiting approval')
            ->greeting('Hello!')
            // No name or email here — an admin sees who it is on the Users page.
            ->line("A new {$this->roleLabel()} account is awaiting approval.")
            ->action('Review pending accounts', url('/admin/users'))
            ->line('Approve or reject the account from the Users page.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'account_pending',
            'title' => 'Account awaiting approval',
            'message' => "{$this->pendingUser->name} ({$this->roleLabel()}) registered and needs approval.",
            'url' => '/admin/users',
        ];
    }

    private function roleLabel(): string
    {
        return Roles::label($this->pendingUser->getRoleNames()->first() ?? '') ?: 'user';
    }
}

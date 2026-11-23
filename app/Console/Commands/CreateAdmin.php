<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Roles;
use Illuminate\Console\Command;

/**
 * Creates the first real administrator on a production server, where the
 * demo seeder (and its well-known password) must never run. The password
 * is typed at a hidden prompt, so it never appears in shell history.
 */
class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin';

    protected $description = 'Create an active administrator account (asks for the details).';

    public function handle(): int
    {
        $first = trim((string) $this->ask('First name'));
        $last = trim((string) $this->ask('Last name'));
        $email = strtolower(trim((string) $this->ask('Email')));

        if ($first === '' || $last === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('A first name, last name and valid email are required.');

            return self::FAILURE;
        }

        if (User::where('email', $email)->exists()) {
            $this->error('An account with that email already exists.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (at least 12 characters)');
        $repeat = (string) $this->secret('Repeat the password');

        if (strlen($password) < 12 || $password !== $repeat) {
            $this->error('The passwords must match and be at least 12 characters.');

            return self::FAILURE;
        }

        $user = User::create([
            'first_name' => $first,
            'last_name' => $last,
            'email' => $email,
            'password' => $password,
            'status' => 'active',
        ]);
        $user->markEmailAsVerified();
        $user->assignRole(Roles::ADMIN);

        $this->info("Administrator {$email} created. Sign in at ".config('app.url'));

        return self::SUCCESS;
    }
}

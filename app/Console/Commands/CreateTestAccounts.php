<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One ready-to-use account per role for a UAT server, sharing a password
 * typed at a hidden prompt (never the public demo password). Accounts
 * that already exist are left alone, so it is safe to run again.
 */
class CreateTestAccounts extends Command
{
    protected $signature = 'app:create-test-accounts';

    protected $description = 'Create one test account per role, with a shared password (UAT servers).';

    /** email => [role, first name, last name] */
    public const ACCOUNTS = [
        'student@gradconnect.tech' => ['student', 'Test', 'Student'],
        'alumni@gradconnect.tech' => ['alumni', 'Test', 'Alumni'],
        'partner@gradconnect.tech' => ['industry_partner', 'Test', 'Partner'],
        'alumni.affairs@gradconnect.tech' => ['alumni_affairs', 'Test', 'Alumni Affairs'],
        'sao@gradconnect.tech' => ['sao', 'Test', 'Student Affairs'],
        'depthead@gradconnect.tech' => ['department_head', 'Test', 'Department Head'],
        'admin@gradconnect.tech' => ['admin', 'Test', 'Admin'],
    ];

    public function handle(): int
    {
        $password = (string) $this->secret('Shared password for the test accounts (at least 10 characters)');
        $repeat = (string) $this->secret('Repeat the password');

        if (strlen($password) < 10 || $password !== $repeat) {
            $this->error('The passwords must match and be at least 10 characters. Nothing was created.');

            return self::FAILURE;
        }

        // The Department Head account belongs to the College of Computer Studies.
        $ccs = Department::where('code', 'CCS')->value('id');

        DB::transaction(function () use ($password, $ccs) {
            foreach (self::ACCOUNTS as $email => [$role, $first, $last]) {
                if (User::where('email', $email)->exists()) {
                    $this->line("  exists   {$email}");

                    continue;
                }

                $user = User::create([
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => $email,
                    'password' => $password,
                    'status' => 'active',
                    'department_id' => $role === 'department_head' ? $ccs : null,
                ]);
                $user->markEmailAsVerified();
                $user->assignRole($role);

                if (in_array($role, ['student', 'alumni'], true)) {
                    $user->graduateProfile()->firstOrCreate(['user_id' => $user->id]);
                }

                $this->line("  created  {$email}");
            }
        });

        $this->info('Done. Give testers the password privately; never put it in the guide.');

        return self::SUCCESS;
    }
}

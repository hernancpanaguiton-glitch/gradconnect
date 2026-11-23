<?php

namespace Tests\Feature\Console;

use App\Console\Commands\CreateTestAccounts;
use App\Models\Department;
use App\Models\User;
use Database\Seeders\CollegeSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateTestAccountsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RolePermissionSeeder::class, CollegeSeeder::class]);
    }

    private function run_with(string $password, ?string $repeat = null)
    {
        return $this->artisan('app:create-test-accounts')
            ->expectsQuestion('Shared password for the test accounts (at least 10 characters)', $password)
            ->expectsQuestion('Repeat the password', $repeat ?? $password);
    }

    public function test_it_creates_one_ready_to_use_account_per_role(): void
    {
        $this->run_with('uat-password-2026')->assertSuccessful();

        foreach (CreateTestAccounts::ACCOUNTS as $email => [$role]) {
            $user = User::where('email', $email)->firstOrFail();
            $this->assertTrue($user->hasRole($role), "$email has $role");
            $this->assertSame('active', $user->status);
            $this->assertNotNull($user->email_verified_at);
            $this->assertTrue(Hash::check('uat-password-2026', $user->password));
        }

        $this->assertCount(7, CreateTestAccounts::ACCOUNTS);
        $this->assertNotNull(User::where('email', 'student@gradconnect.tech')->first()->graduateProfile);
        $this->assertNotNull(User::where('email', 'alumni@gradconnect.tech')->first()->graduateProfile);
        $this->assertSame(
            Department::where('code', 'CCS')->value('id'),
            User::where('email', 'depthead@gradconnect.tech')->first()->department_id,
        );
    }

    public function test_running_it_again_leaves_existing_accounts_untouched(): void
    {
        $this->run_with('uat-password-2026')->assertSuccessful();
        $this->run_with('another-password-99')->assertSuccessful();

        $this->assertSame(7, User::count());
        $this->assertTrue(Hash::check('uat-password-2026', User::where('email', 'admin@gradconnect.tech')->first()->password));
    }

    public function test_a_short_or_mismatched_password_creates_nothing(): void
    {
        $this->run_with('short')->assertFailed();
        $this->run_with('uat-password-2026', 'uat-password-2027')->assertFailed();

        $this->assertSame(0, User::count());
    }
}

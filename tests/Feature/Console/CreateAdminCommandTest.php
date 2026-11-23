<?php

namespace Tests\Feature\Console;

use App\Models\User;
use App\Support\Roles;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_it_creates_an_active_verified_admin_from_prompted_details(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('First name', 'Ada')
            ->expectsQuestion('Last name', 'Reyes')
            ->expectsQuestion('Email', 'ada@uclm.edu.ph')
            ->expectsQuestion('Password (at least 12 characters)', 'a-long-passphrase')
            ->expectsQuestion('Repeat the password', 'a-long-passphrase')
            ->assertSuccessful();

        $user = User::where('email', 'ada@uclm.edu.ph')->firstOrFail();
        $this->assertTrue($user->hasRole(Roles::ADMIN));
        $this->assertSame('active', $user->status);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(Hash::check('a-long-passphrase', $user->password));
    }

    public function test_it_refuses_a_short_or_mismatched_password_and_creates_nobody(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('First name', 'Ada')
            ->expectsQuestion('Last name', 'Reyes')
            ->expectsQuestion('Email', 'ada@uclm.edu.ph')
            ->expectsQuestion('Password (at least 12 characters)', 'short')
            ->expectsQuestion('Repeat the password', 'short')
            ->assertFailed();

        $this->artisan('app:create-admin')
            ->expectsQuestion('First name', 'Ada')
            ->expectsQuestion('Last name', 'Reyes')
            ->expectsQuestion('Email', 'ada@uclm.edu.ph')
            ->expectsQuestion('Password (at least 12 characters)', 'a-long-passphrase')
            ->expectsQuestion('Repeat the password', 'a-different-one!')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'ada@uclm.edu.ph']);
    }

    public function test_it_refuses_an_email_that_already_has_an_account(): void
    {
        User::factory()->create(['email' => 'taken@uclm.edu.ph']);

        $this->artisan('app:create-admin')
            ->expectsQuestion('First name', 'Ada')
            ->expectsQuestion('Last name', 'Reyes')
            ->expectsQuestion('Email', 'taken@uclm.edu.ph')
            ->assertFailed();

        $this->assertSame(1, User::where('email', 'taken@uclm.edu.ph')->count());
    }
}

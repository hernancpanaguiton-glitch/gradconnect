<?php

namespace Tests\Feature\Auth;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'student',
            'consent' => true,
        ], $overrides);
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_student_registers_active_and_is_logged_in(): void
    {
        Event::fake();

        $response = $this->post('/register', $this->payload(['role' => 'student']));

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user = User::firstWhere('email', 'test@example.com');
        $this->assertTrue($user->hasRole('student'));
        $this->assertSame('active', $user->status);
        $this->assertNull($user->email_verified_at);
        Event::assertDispatched(Registered::class);
    }

    public function test_alumni_registers_active_and_is_logged_in(): void
    {
        $this->post('/register', $this->payload(['email' => 'grad@example.com', 'role' => 'alumni']));

        $this->assertAuthenticated();
        $user = User::firstWhere('email', 'grad@example.com');
        $this->assertTrue($user->hasRole('alumni'));
        $this->assertSame('active', $user->status);
    }

    #[DataProvider('approvalRoles')]
    public function test_staff_and_employer_roles_are_pending_and_not_logged_in(string $formRole, string $roleName): void
    {
        $response = $this->post('/register', $this->payload([
            'email' => "{$formRole}@example.com",
            'role' => $formRole,
        ]));

        $this->assertGuest();
        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status');

        $user = User::firstWhere('email', "{$formRole}@example.com");
        $this->assertTrue($user->hasRole($roleName));
        $this->assertSame('pending', $user->status);
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function approvalRoles(): array
    {
        return [
            'alumni officer' => ['alumni_officer', 'alumni_affairs'],
            'dean' => ['dean', 'department_head'],
            'industry partner' => ['industry_partner', 'industry_partner'],
            'student affairs office' => ['sao', 'sao'],
        ];
    }

    public function test_role_is_required(): void
    {
        $this->post('/register', $this->payload(['role' => '']))
            ->assertSessionHasErrors('role');
    }

    public function test_admin_role_cannot_be_self_registered(): void
    {
        $this->post('/register', $this->payload(['role' => 'admin']))
            ->assertSessionHasErrors('role');

        $this->assertGuest();
    }

    public function test_consent_is_required(): void
    {
        $this->post('/register', $this->payload(['consent' => false]))
            ->assertSessionHasErrors('consent');

        $this->assertGuest();
    }

    public function test_registration_is_rejected_when_disabled(): void
    {
        Setting::set('registration_enabled', '0');

        $this->post('/register', $this->payload())->assertForbidden();

        $this->assertGuest();
        $this->assertNull(User::firstWhere('email', 'test@example.com'));
    }
}

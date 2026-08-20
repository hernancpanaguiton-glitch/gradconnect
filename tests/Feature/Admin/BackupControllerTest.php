<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_non_admin_cannot_view_or_create_backups(): void
    {
        $alumni = User::factory()->alumni()->create();

        $this->actingAs($alumni)->get(route('admin.backups.index'))->assertForbidden();
        $this->actingAs($alumni)->post(route('admin.backups.store'))->assertForbidden();
    }

    public function test_index_lists_existing_backup_files(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('backups/backup-2026-01-01_000000.sql', 'dummy dump content');

        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.backups.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Backups')
                ->has('backups', 1)
                ->where('backups.0.name', 'backup-2026-01-01_000000.sql')
            );
    }

    public function test_admin_can_download_a_backup(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('backups/backup-2026-01-01_000000.sql', 'dummy dump content');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.backups.download', 'backup-2026-01-01_000000.sql'))
            ->assertOk();
    }

    public function test_download_rejects_a_path_outside_the_backups_directory(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('secret.txt', 'not a backup');
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('admin.backups.download', '..%2Fsecret.txt'))->assertNotFound();
    }

    public function test_store_runs_the_backup_command_and_logs_it(): void
    {
        Process::fake();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post(route('admin.backups.store'))->assertRedirect();

        $this->assertDatabaseHas('audit_logs', ['action' => 'backup.created', 'user_id' => $admin->id]);
    }
}

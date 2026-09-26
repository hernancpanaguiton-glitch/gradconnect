<?php

namespace Tests\Feature\Admin;

use App\Console\Commands\RestoreDatabaseBackup;
use App\Console\Commands\RunDatabaseBackup;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
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

    public function test_store_logs_a_failure_when_the_backup_command_fails(): void
    {
        Process::fake();
        $admin = User::factory()->admin()->create();

        // The suite runs on SQLite, so the pg_dump-based command bails out.
        // The audit trail is where someone checks a backup exists, so a failed
        // run must not leave a "backup.created" entry behind.
        $this->actingAs($admin)->post(route('admin.backups.store'))->assertRedirect();

        $this->assertDatabaseHas('audit_logs', ['action' => 'backup.failed', 'user_id' => $admin->id]);
        $this->assertDatabaseMissing('audit_logs', ['action' => 'backup.created']);
    }

    public function test_store_logs_success_when_the_backup_command_succeeds(): void
    {
        Artisan::shouldReceive('call')->once()->with('backup:run')->andReturn(0);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post(route('admin.backups.store'))->assertRedirect();

        $this->assertDatabaseHas('audit_logs', ['action' => 'backup.created', 'user_id' => $admin->id]);
    }

    public function test_the_dump_can_overwrite_an_existing_database(): void
    {
        $arguments = RunDatabaseBackup::dumpArguments(
            ['host' => 'h', 'port' => 1, 'username' => 'u', 'database' => 'd'],
            '/tmp/backup.sql'
        );

        // Without these a restore fails on every statement, because each
        // object already exists.
        $this->assertContains('--clean', $arguments);
        $this->assertContains('--if-exists', $arguments);
    }

    public function test_the_restore_stops_on_the_first_error(): void
    {
        $arguments = RestoreDatabaseBackup::restoreArguments(
            ['host' => 'h', 'port' => 1, 'username' => 'u', 'database' => 'd'],
            '/tmp/backup.sql'
        );

        // psql otherwise exits 0 after every statement failed, so a restore
        // that did nothing reported success.
        $this->assertContains('--set=ON_ERROR_STOP=1', $arguments);
        $this->assertContains('--single-transaction', $arguments);
    }
}

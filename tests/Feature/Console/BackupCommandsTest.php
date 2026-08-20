<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackupCommandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_backup_run_is_a_graceful_no_op_outside_postgres(): void
    {
        $this->artisan('backup:run')
            ->expectsOutputToContain('Backups are only supported on PostgreSQL')
            ->assertFailed();
    }

    public function test_backup_restore_is_a_graceful_no_op_outside_postgres(): void
    {
        $this->artisan('backup:restore', ['file' => 'anything.sql'])
            ->expectsOutputToContain('Restores are only supported on PostgreSQL')
            ->assertFailed();
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * Database backup (NFR "support database backup and recovery"; Fig. 15
 * "Manage Data & Backups"). PostgreSQL-only, mirroring the pgvector
 * columns' own "no-op outside Postgres" pattern used elsewhere in this
 * codebase — there's no meaningful pg_dump equivalent for SQLite.
 */
class RunDatabaseBackup extends Command
{
    protected $signature = 'backup:run';

    protected $description = 'Create a pg_dump snapshot of the database into storage/app/private/backups.';

    /**
     * Whether a PostgreSQL client binary is actually callable on this host.
     *
     * pg_dump ships with the Postgres *client* tools, which are frequently
     * absent on a machine that talks to Postgres over TCP (or runs it in
     * Docker). Without this check the failure surfaces as a generic "backup
     * failed", which is indistinguishable from a real backup error.
     */
    public static function binaryAvailable(string $binary = 'pg_dump'): bool
    {
        try {
            return Process::run([$binary, '--version'])->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->warn('Backups are only supported on PostgreSQL. Current driver: '.DB::connection()->getDriverName());

            return self::FAILURE;
        }

        if (! self::binaryAvailable()) {
            $this->error(
                'pg_dump was not found on PATH. Install the PostgreSQL client tools '.
                '(or run this inside the Docker app container, which has them) and try again.'
            );

            return self::FAILURE;
        }

        $config = config('database.connections.pgsql');

        $disk = Storage::disk('local');
        $disk->makeDirectory('backups');

        $filename = 'backup-'.now()->format('Y-m-d_His').'.sql';
        $path = $disk->path("backups/{$filename}");

        $result = Process::env(['PGPASSWORD' => $config['password']])
            ->timeout(300)
            ->run([
                ...self::dumpArguments($config, $path),
            ]);

        if ($result->failed()) {
            // A partial dump looks like a usable backup in the admin list.
            $disk->delete("backups/{$filename}");

            $this->error('Backup failed: '.$result->errorOutput());

            return self::FAILURE;
        }

        $this->info("Backup written to {$path}");

        return self::SUCCESS;
    }

    /**
     * pg_dump arguments.
     *
     * --clean --if-exists makes the dump drop each object before recreating
     * it; without them a restore into a database that already has tables
     * fails on every single statement. --no-owner/--no-privileges let the
     * dump restore as a different role than it was taken by.
     *
     * @param  array<string, mixed>  $config
     * @return array<int, string>
     */
    public static function dumpArguments(array $config, string $path): array
    {
        return [
            'pg_dump',
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--username='.$config['username'],
            '--format=plain',
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges',
            '--file='.$path,
            $config['database'],
        ];
    }
}

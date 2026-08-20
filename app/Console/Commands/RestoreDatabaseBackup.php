<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * Restores the database from a pg_dump snapshot. Deliberately CLI-only —
 * this overwrites the live database, so unlike backup:run it is not
 * exposed as a one-click web action. An administrator runs this directly
 * on the server and must confirm the destructive prompt.
 */
class RestoreDatabaseBackup extends Command
{
    protected $signature = 'backup:restore {file : Filename under storage/app/private/backups}';

    protected $description = 'Restore the database from a backup file (destructive — CLI only, requires confirmation).';

    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->warn('Restores are only supported on PostgreSQL. Current driver: '.DB::connection()->getDriverName());

            return self::FAILURE;
        }

        $disk = Storage::disk('local');
        $relativePath = 'backups/'.basename((string) $this->argument('file'));

        if (! $disk->exists($relativePath)) {
            $this->error("Backup file not found: {$relativePath}");

            return self::FAILURE;
        }

        if (! $this->confirm("This will OVERWRITE the current database with {$relativePath}. Continue?")) {
            return self::FAILURE;
        }

        $config = config('database.connections.pgsql');
        $path = $disk->path($relativePath);

        $result = Process::env(['PGPASSWORD' => $config['password']])
            ->timeout(300)
            ->run([
                'psql',
                '--host='.$config['host'],
                '--port='.$config['port'],
                '--username='.$config['username'],
                '--file='.$path,
                $config['database'],
            ]);

        if ($result->failed()) {
            $this->error('Restore failed: '.$result->errorOutput());

            return self::FAILURE;
        }

        $this->info("Database restored from {$path}");

        return self::SUCCESS;
    }
}

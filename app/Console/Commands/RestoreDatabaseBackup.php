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
                ...self::restoreArguments($config, $path),
            ]);

        if ($result->failed()) {
            $this->error('Restore failed: '.$result->errorOutput());

            return self::FAILURE;
        }

        $this->info("Database restored from {$path}");

        return self::SUCCESS;
    }

    /**
     * psql arguments.
     *
     * Without ON_ERROR_STOP psql reports success after every statement in the
     * file failed, so a restore that did nothing looked like it worked.
     * --single-transaction then makes a failed restore leave the database as
     * it was rather than half-written.
     *
     * @param  array<string, mixed>  $config
     * @return array<int, string>
     */
    public static function restoreArguments(array $config, string $path): array
    {
        return [
            'psql',
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--username='.$config['username'],
            '--set=ON_ERROR_STOP=1',
            '--single-transaction',
            '--no-psqlrc',
            '--file='.$path,
            $config['database'],
        ];
    }
}

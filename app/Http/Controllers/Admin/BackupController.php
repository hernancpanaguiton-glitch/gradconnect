<?php

namespace App\Http\Controllers\Admin;

use App\Console\Commands\RunDatabaseBackup;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Manage Data & Backups (Fig. 15). Create/list/download only — restore
     * is deliberately CLI-only (see RestoreDatabaseBackup) since it
     * overwrites the live database.
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        $disk = Storage::disk('local');
        $disk->makeDirectory('backups');

        $backups = collect($disk->files('backups'))
            ->map(fn (string $path) => [
                'name' => basename($path),
                'size' => $disk->size($path),
                'created_at' => date('Y-m-d H:i:s', $disk->lastModified($path)),
            ])
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('Admin/Backups', [
            'backups' => $backups,
            'isPostgres' => DB::connection()->getDriverName() === 'pgsql',
            // Say plainly that the client tools are missing rather than letting
            // the user discover it as an opaque "backup failed".
            'pgDumpAvailable' => RunDatabaseBackup::binaryAvailable(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        $exitCode = Artisan::call('backup:run');

        // The audit trail is where someone looks to confirm a backup exists,
        // so a failed run must not leave a "backup.created" entry behind.
        AuditLog::record(
            $exitCode === 0 ? 'backup.created' : 'backup.failed',
            $request->user(),
            $exitCode === 0
                ? 'Triggered a manual database backup'
                : 'Manual database backup failed',
        );

        if ($exitCode !== 0) {
            Log::error('Manual database backup failed.', ['output' => Artisan::output()]);
        }

        return back()->with(
            $exitCode === 0 ? 'success' : 'error',
            $exitCode === 0 ? 'Backup created.' : 'Backup failed — check server logs.',
        );
    }

    public function download(Request $request, string $filename): StreamedResponse
    {
        abort_unless($request->user()->hasPermissionTo('system.settings'), 403);

        $path = 'backups/'.basename($filename);
        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path);
    }
}

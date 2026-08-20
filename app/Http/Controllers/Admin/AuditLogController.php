<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Security-relevant action log (Fig. 15 "System Logs & Audit Trail").
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('reports.system.view'), 403);

        $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $logs = AuditLog::with('user')
            ->when($request->input('search'), function ($query, $search) use ($like) {
                $query->where(function ($q) use ($search, $like) {
                    $q->where('action', $like, "%{$search}%")
                        ->orWhere('description', $like, "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', $like, "%{$search}%"));
                });
            })
            ->when($request->input('action'), fn ($query, $action) => $query->where('action', $action))
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/AuditLogs', [
            'logs' => $logs,
            'actions' => AuditLog::query()->distinct()->orderBy('action')->pluck('action'),
            'filters' => $request->only(['search', 'action']),
        ]);
    }
}

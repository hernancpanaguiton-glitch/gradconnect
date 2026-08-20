import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Activity, Search } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
    id: number; action: string; description: string | null; ip_address: string | null;
    created_at: string; user: { name: string; email: string } | null;
}
interface Paginated<T> { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number }
interface Props extends PageProps {
    logs: Paginated<LogEntry>;
    actions: string[];
    filters: { search: string | null; action: string | null };
}

const LEVEL: Record<string, string> = {
    login_failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    'user.deleted': 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    'role.deleted': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'role.permissions_updated': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'user.updated': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};
const DEFAULT_LEVEL = 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';

export default function AuditLogs({ logs, actions, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(next: Partial<{ search: string; action: string }>) {
        router.get(route('admin.audit-logs'), { search, action: filters.action ?? '', ...next }, { preserveState: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Audit Logs" />
            <div className="space-y-6">
                <PageHeader icon={Activity} title="Audit Logs" subtitle="A record of security-relevant actions across the platform." />

                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilters({ search }); }} className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                        <Search size={16} className="text-muted-foreground" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by actor, action, or description…"
                            className="flex-1 bg-transparent text-sm focus:outline-none" />
                    </form>
                    <select value={filters.action ?? ''} onChange={(e) => applyFilters({ action: e.target.value })}
                        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                        <option value="">All actions</option>
                        {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">Time</th><th className="px-6 py-3 font-medium">Actor</th><th className="px-6 py-3 font-medium">Action</th><th className="px-6 py-3 font-medium">Description</th><th className="px-6 py-3 font-medium">IP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.data.map((l) => (
                                <tr key={l.id} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-foreground">{l.user?.email ?? 'system'}</td>
                                    <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL[l.action] ?? DEFAULT_LEVEL}`}>{l.action}</span></td>
                                    <td className="px-6 py-3 text-muted-foreground">{l.description ?? '—'}</td>
                                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{l.ip_address ?? '—'}</td>
                                </tr>
                            ))}
                            {logs.data.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No matching log entries.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {logs.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {logs.links.map((link, i) => (
                            <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${link.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

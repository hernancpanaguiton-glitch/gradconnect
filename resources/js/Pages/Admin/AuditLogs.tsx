import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Activity, Search } from 'lucide-react';

const LOGS = [
    { actor: 'admin@gradconnect.edu.ph', action: 'Updated user role', target: 'james.ramos', level: 'info', time: '2026-07-03 09:14' },
    { actor: 'partner@gradconnect.edu.ph', action: 'Created job posting', target: 'Backend Engineer', level: 'info', time: '2026-07-03 08:52' },
    { actor: 'system', action: 'Failed login attempt', target: 'unknown@x.com', level: 'warning', time: '2026-07-03 08:40' },
    { actor: 'admin@gradconnect.edu.ph', action: 'Deleted user account', target: 'test.user', level: 'danger', time: '2026-07-02 17:20' },
    { actor: 'alumni.affairs@gradconnect.edu.ph', action: 'Opened tracer survey', target: 'Tracer 2026', level: 'info', time: '2026-07-02 15:03' },
];
const LEVEL: Record<string, string> = {
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export default function AuditLogs() {
    return (
        <AuthenticatedLayout>
            <Head title="Audit Logs" />
            <div className="space-y-6">
                <PageHeader icon={Activity} title="Audit Logs" subtitle="A record of security-relevant actions across the platform." />

                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                        <Search size={16} className="text-muted-foreground" />
                        <input placeholder="Search by actor, action, or target…" className="flex-1 bg-transparent text-sm focus:outline-none" />
                    </div>
                    <select className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                        <option>All levels</option><option>Info</option><option>Warning</option><option>Danger</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">Time</th><th className="px-6 py-3 font-medium">Actor</th><th className="px-6 py-3 font-medium">Action</th><th className="px-6 py-3 font-medium">Target</th><th className="px-6 py-3 font-medium">Level</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {LOGS.map((l, i) => (
                                <tr key={i} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{l.time}</td>
                                    <td className="px-6 py-3 text-foreground">{l.actor}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{l.action}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{l.target}</td>
                                    <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${LEVEL[l.level]}`}>{l.level}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

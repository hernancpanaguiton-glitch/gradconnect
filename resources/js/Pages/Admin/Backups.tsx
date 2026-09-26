import TableCard from '@/Components/TableCard';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Database, Download } from 'lucide-react';
import { useState } from 'react';

interface Backup { name: string; size: number; created_at: string }
interface Props extends PageProps { backups: Backup[]; isPostgres: boolean; pgDumpAvailable: boolean }

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Backups({ backups, isPostgres, pgDumpAvailable }: Props) {
    const [creating, setCreating] = useState(false);
    const canBackup = isPostgres && pgDumpAvailable;

    function createBackup() {
        setCreating(true);
        router.post(route('admin.backups.store'), {}, { onFinish: () => setCreating(false) });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Data & Backups" />
            <div className="space-y-6">
                <PageHeader
                    icon={Database}
                    title="Data & Backups"
                    subtitle="Snapshot the database for disaster recovery."
                    action={canBackup ? (
                        <button onClick={createBackup} disabled={creating}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">
                            {creating ? 'Creating…' : 'Create Backup Now'}
                        </button>
                    ) : undefined}
                />

                {!isPostgres && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
                        Backups require a PostgreSQL connection. The current database driver doesn't support pg_dump snapshots.
                    </div>
                )}

                {isPostgres && !pgDumpAvailable && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-500/10">
                        <p className="font-semibold text-amber-900 dark:text-amber-300">
                            pg_dump is not installed on this server
                        </p>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
                            The database is reachable, but the PostgreSQL client tools that actually produce the
                            snapshot are not on this machine's PATH, so backups cannot run here. Install the
                            PostgreSQL client tools, or run the app from the Docker container, which includes them.
                        </p>
                    </div>
                )}

                <TableCard>
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">File</th><th className="px-6 py-3 font-medium">Size</th><th className="px-6 py-3 font-medium">Created</th><th className="px-6 py-3 font-medium"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {backups.map((b) => (
                                <tr key={b.name} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-mono text-xs text-foreground">{b.name}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{formatBytes(b.size)}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{b.created_at}</td>
                                    <td className="px-6 py-3 text-right">
                                        <a href={route('admin.backups.download', b.name)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                            <Download size={13} /> Download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {backups.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No backups yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </TableCard>

                <p className="text-xs text-muted-foreground">
                    Restoring a backup overwrites the live database and is available only via the server CLI
                    (<code className="rounded bg-muted px-1 py-0.5">php artisan backup:restore &lt;file&gt;</code>), not from this page.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}

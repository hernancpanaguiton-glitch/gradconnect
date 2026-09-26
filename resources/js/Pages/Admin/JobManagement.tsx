import Pagination from '@/Components/Pagination';
import TableCard from '@/Components/TableCard';
import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Briefcase, CheckCircle2, FileEdit, Search, XCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Posting {
    id: number;
    title: string;
    status: 'draft' | 'open' | 'closed';
    applications_count: number;
    created_at: string;
    company: { id: number; name: string } | null;
}

interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props extends PageProps {
    postings: Paginated<Posting>;
    filters: { search: string };
    stats: { total: number; open: number; closed: number; draft: number };
}

const STATUS_CLASSES: Record<Posting['status'], string> = {
    open: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    draft: 'bg-muted text-muted-foreground',
    closed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function JobManagement({ postings, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(e: FormEvent) {
        e.preventDefault();
        router.get(route('admin.jobs'), { search: search || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function toggleStatus(posting: Posting) {
        const next = posting.status === 'closed' ? 'open' : 'closed';
        router.patch(route('admin.jobs.update-status', posting.id), { status: next }, { preserveScroll: true });
    }

    function destroy(posting: Posting) {
        if (!confirm(`Remove "${posting.title}"? This cannot be undone.`)) return;
        router.delete(route('admin.jobs.destroy', posting.id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Job Management" />
            <div className="space-y-6">
                <PageHeader icon={Briefcase} title="Job Management" subtitle="Moderate job postings from every industry partner on the platform." />

                <div className="grid gap-5 sm:grid-cols-3">
                    <StatTile icon={Briefcase} color="blue" label="Total Postings" value={stats.total} />
                    <StatTile icon={CheckCircle2} color="green" label="Open" value={stats.open} />
                    <StatTile icon={XCircle} color="red" label="Closed" value={stats.closed} sub={`${stats.draft} draft`} />
                </div>

                <form onSubmit={submit} className="relative max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title or company…"
                        className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                </form>

                <TableCard wide>
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Posting</th>
                                <th className="px-6 py-3 font-medium">Company</th>
                                <th className="px-6 py-3 font-medium">Posted</th>
                                <th className="px-6 py-3 font-medium">Applicants</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {postings.data.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-medium text-foreground">{p.title}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{p.company?.name ?? '—'}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{p.applications_count}</td>
                                    <td className="px-6 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLASSES[p.status]}`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-3">
                                            {p.status !== 'draft' && (
                                                <button onClick={() => toggleStatus(p)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                                    <FileEdit size={12} /> {p.status === 'closed' ? 'Reopen' : 'Close'}
                                                </button>
                                            )}
                                            <button onClick={() => destroy(p)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {postings.data.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No job postings match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </TableCard>

                <Pagination links={postings.links} />
            </div>
        </AuthenticatedLayout>
    );
}

import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Briefcase, CheckCircle2, Send, Star } from 'lucide-react';

interface Application {
    id: number;
    status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
    applied_at: string | null;
    job_posting: {
        id: number;
        title: string;
        company: { name: string } | null;
    };
}

interface Props {
    hasProfile: boolean;
    applications: Application[];
    stats: { total: number; shortlisted: number; hired: number };
}

const STATUS_LABELS: Record<Application['status'], string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    hired: 'Hired',
    withdrawn: 'Withdrawn',
};

const STATUS_CLASSES: Record<Application['status'], string> = {
    submitted: 'bg-muted text-muted-foreground',
    under_review: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    shortlisted: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    hired: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    withdrawn: 'bg-muted text-muted-foreground',
};

const WITHDRAWABLE: Application['status'][] = ['submitted', 'under_review', 'shortlisted'];

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Applications({ hasProfile, applications, stats }: Props) {
    function withdraw(id: number) {
        if (!confirm('Withdraw this application?')) return;
        router.patch(route('applications.withdraw', id), {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Applications" />
            <div className="space-y-6">
                <PageHeader icon={Briefcase} title="My Applications" subtitle="Track every role you've applied to and where it stands." />

                {!hasProfile ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">Complete your graduate profile to start applying for jobs.</p>
                        <Link href={route('graduate.profile.edit')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Complete My Profile
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <StatTile icon={Send} color="blue" label="Applications" value={stats.total} />
                            <StatTile icon={Star} color="amber" label="Shortlisted" value={stats.shortlisted} />
                            <StatTile icon={CheckCircle2} color="green" label="Hired" value={stats.hired} />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            {applications.length === 0 ? (
                                <p className="p-8 text-center text-muted-foreground">
                                    You haven't applied to any jobs yet. Browse the{' '}
                                    <Link href={route('jobs.index')} className="font-medium text-primary hover:underline">job board</Link>{' '}
                                    to get started.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Role</th>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Applied</th>
                                            <th className="px-4 py-3 font-medium" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {applications.map((a) => (
                                            <tr key={a.id} className="hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    <Link href={route('jobs.show', a.job_posting.id)} className="hover:text-primary hover:underline">
                                                        {a.job_posting.title}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{a.job_posting.company?.name ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[a.status]}`}>
                                                        {STATUS_LABELS[a.status]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatDate(a.applied_at)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {WITHDRAWABLE.includes(a.status) && (
                                                        <button onClick={() => withdraw(a.id)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

import ProgressRing from '@/Components/ProgressRing';
import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Circle, ClipboardList, ListChecks, Star, Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MonthlyApplied { month: string; applied: number }
interface RecentApplication {
    company: string;
    position: string;
    match: number | null;
    status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
    date: string | null;
}
interface ChecklistItem { label: string; done: boolean }

interface Props extends PageProps<{
    stats: Stat[];
    applicationActivity: MonthlyApplied[];
    recentApplications: RecentApplication[];
    profileChecklist: ChecklistItem[];
}> {}

// Keyed loosely on purpose: the application status vocabulary lives in the
// database, so a status added there must still render as a legible badge
// rather than as the word "undefined" in a class list.
const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    hired: 'Hired',
    withdrawn: 'Withdrawn',
};

const statusStyles: Record<string, string> = {
    submitted: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    shortlisted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    hired: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    withdrawn: 'bg-muted text-muted-foreground',
};
const STATUS_FALLBACK = 'bg-muted text-muted-foreground';

/** "under_review" -> "Under Review", for a status with no label of its own. */
function humaniseStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AlumniDashboard({ stats, applicationActivity, recentApplications, profileChecklist }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';
    const completion = parseInt(String(byLabel('Profile Completion')), 10) || 0;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.first_name}!</h1>
                        <p className="mt-1 text-muted-foreground">Here's an overview of your career journey.</p>
                    </div>
                    <Link
                        href={route('jobs.index')}
                        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
                    >
                        Browse Jobs
                    </Link>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Target} color="blue" label="Profile Completion" value={byLabel('Profile Completion')} />
                    <StatTile icon={Star} color="violet" label="Job Recommendations" value={byLabel('Job Recommendations')} />
                    <StatTile icon={ListChecks} color="green" label="Applications" value={byLabel('Applications')} />
                    <StatTile icon={ClipboardList} color="amber" label="Pending Surveys" value={byLabel('Pending Surveys')} />
                </div>

                {/* Chart + Profile completion */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-foreground">Application Activity</h2>
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Last 6 months</span>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={applicationActivity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="applied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            color: 'var(--foreground)',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Area type="monotone" dataKey="applied" stroke="var(--primary)" strokeWidth={2} fill="url(#applied)" name="Applied" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-foreground">Profile Completion</h2>
                        <div className="flex justify-center">
                            <ProgressRing value={completion} />
                        </div>
                        <ul className="mt-5 space-y-2">
                            {profileChecklist.map((c) => (
                                <li key={c.label} className="flex items-center gap-2 text-sm">
                                    {c.done ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                        <Circle size={16} className="text-muted-foreground" />
                                    )}
                                    <span className={c.done ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recent applications */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border p-5">
                        <h2 className="text-base font-semibold text-foreground">Recent Applications</h2>
                        <Link href={route('applications.index')} className="text-sm font-medium text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    {recentApplications.length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">
                            You haven't applied to any jobs yet.{' '}
                            <Link href={route('jobs.index')} className="font-medium text-primary hover:underline">Browse the job board</Link>.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-5 py-3 font-medium">Company</th>
                                        <th className="px-5 py-3 font-medium">Position</th>
                                        <th className="px-5 py-3 font-medium">AI Match</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentApplications.map((r, i) => (
                                        <tr key={i} className="text-foreground">
                                            <td className="px-5 py-3 font-medium">{r.company}</td>
                                            <td className="px-5 py-3 text-muted-foreground">{r.position}</td>
                                            <td className="px-5 py-3 font-semibold text-primary">{r.match !== null ? `${r.match}%` : '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.status] ?? STATUS_FALLBACK}`}>
                                                    {STATUS_LABELS[r.status] ?? humaniseStatus(r.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-muted-foreground">{r.date ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

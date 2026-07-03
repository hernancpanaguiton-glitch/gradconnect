import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { applicationFunnel } from '@/lib/demoData';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Brain, Briefcase, CheckCircle2, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function IndustryPartnerDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Welcome, {user.first_name}!</h1>
                        <p className="mt-1 text-muted-foreground">Manage your postings and discover talented graduates.</p>
                    </div>
                    <Link href={route('postings.create')} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
                        Post a Job
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Briefcase} color="blue" label="Active Postings" value={byLabel('Active Postings')} />
                    <StatTile icon={Users} color="sky" label="Total Applications" value={byLabel('Total Applications')} />
                    <StatTile icon={CheckCircle2} color="green" label="Shortlisted" value={byLabel('Shortlisted')} />
                    <StatTile icon={Brain} color="violet" label="AI Matches" value={byLabel('AI Matches')} />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-foreground">Hiring Funnel</h2>
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Last 6 months</span>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={applicationFunnel} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="applied" name="Applied" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="interview" name="Interview" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="offer" name="Offer" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('postings.create')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Post a Job</Link>
                        <Link href={route('postings.index')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">My Postings</Link>
                        <Link href={route('company.edit')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Company Profile</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Clock, Shield, Users } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface IndustrySlice { name: string; value: number; color: string }

export default function AdminDashboard({ stats, industryDistribution }: PageProps<{ stats: Stat[]; industryDistribution: IndustrySlice[] }>) {
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">System Administration</h1>
                    <p className="mt-1 text-muted-foreground">Manage users, roles, job moderation, and system configuration.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Users} color="blue" label="Total Users" value={byLabel('Total Users')} />
                    <StatTile icon={Clock} color="amber" label="Pending Approvals" value={byLabel('Pending Approvals')} />
                    <StatTile icon={Briefcase} color="green" label="Active Job Postings" value={byLabel('Active Job Postings')} />
                    <StatTile icon={Shield} color="violet" label="Roles" value={byLabel('Roles')} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <h2 className="text-base font-semibold text-foreground">User Management</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Manage accounts, status, and role assignments.</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link href={route('admin.users.index')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Manage Users</Link>
                                    <Link href={route('admin.roles.index')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Roles &amp; Permissions</Link>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-border pt-6">
                            <h2 className="text-base font-semibold text-foreground">Job Moderation</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Review and approve industry-partner job postings.</p>
                            <Link href="/admin/jobs" className="mt-4 inline-block rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Review Postings</Link>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-foreground">Graduate Industries</h2>
                        {industryDistribution.length === 0 ? (
                            <p className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                                No current employment records with an industry on file yet.
                            </p>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={industryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                                            {industryDistribution.map((d) => (
                                                <Cell key={d.name} fill={d.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

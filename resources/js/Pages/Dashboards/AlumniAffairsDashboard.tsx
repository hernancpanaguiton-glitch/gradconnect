import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { employmentTrend, industryDistribution } from '@/lib/demoData';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, ListChecks, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AlumniAffairsDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Alumni Affairs Office</h1>
                    <p className="mt-1 text-muted-foreground">Manage alumni records, surveys, and employability programs.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Users} color="blue" label="Total Alumni" value={byLabel('Total Alumni')} />
                    <StatTile icon={ClipboardList} color="violet" label="Active Surveys" value={byLabel('Active Surveys')} />
                    <StatTile icon={ListChecks} color="green" label="Survey Responses" value={byLabel('Survey Responses')} />
                    <StatTile icon={TrendingUp} color="amber" label="Employment Rate" value={byLabel('Employment Rate')} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <h2 className="mb-4 text-base font-semibold text-foreground">Employment Trend</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={employmentTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="emp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="employed" name="Employed %" stroke="var(--primary)" strokeWidth={2} fill="url(#emp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-foreground">Industry Distribution</h2>
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
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('surveys.create')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Create Survey</Link>
                        <Link href={route('surveys.index')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Manage Surveys</Link>
                        <Link href={route('reports.employability')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Employability Report</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

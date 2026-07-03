import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { employmentTrend, industryDistribution } from '@/lib/demoData';
import { Head, Link } from '@inertiajs/react';
import { BarChart2, Download } from 'lucide-react';
import { Area, AreaChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const REPORTS = [
    { title: 'Employability Report', desc: 'Employment status and rate by cohort', href: '/reports/employability' },
    { title: 'Graduate Tracer Study', desc: 'CHED-compliant tracer outcomes', href: '/surveys' },
    { title: 'Industry Distribution', desc: 'Where graduates are employed', href: '/reports/employability' },
    { title: 'Program Outcomes', desc: 'Placement rate by program', href: '/reports/employability' },
];

export default function ReportsHub() {
    return (
        <AuthenticatedLayout>
            <Head title="Reports" />
            <div className="space-y-6">
                <PageHeader
                    icon={BarChart2}
                    title="Reports & Analytics"
                    subtitle="Institutional analytics for employability, tracer studies, and accreditation."
                    action={(
                        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                            <Download size={16} /> Export
                        </button>
                    )}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Employment Trend</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={employmentTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                                    <Area dataKey="employed" name="Employed %" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Industry Distribution</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={industryDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                                        {industryDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                    </Pie>
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {REPORTS.map((r) => (
                        <Link key={r.title} href={r.href} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                            <p className="font-semibold text-foreground">{r.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { placementByProgram } from '@/lib/demoData';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { GraduationCap, Target, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DepartmentHeadDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Department Head</h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">
                        Empirical data for continuous academic improvement and quality assurance — graduate employment,
                        program outcomes, and skill gaps to support curriculum updates and accreditation (PACUCOA, CHED, ISO).
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatTile icon={GraduationCap} color="blue" label="Graduates" value={byLabel('Graduates')} />
                    <StatTile icon={TrendingUp} color="green" label="Employment Rate" value={byLabel('Employment Rate')} />
                    <StatTile icon={Target} color="violet" label="Related Employment" value={byLabel('Related Employment')} />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-semibold text-foreground">Placement Rate by Program</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={placementByProgram} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                <Bar dataKey="rate" name="Placement %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground">Reports</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('reports.employability')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Employability Report</Link>
                        <Link href="/skill-gap" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Skills Gap Analysis</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { placementByProgram } from '@/lib/demoData';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Activity, GraduationCap, Target, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SaoDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Student Affairs Office</h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">
                        A data-driven foundation for non-academic student support and holistic development. Monitor
                        career-readiness participation and early skill-gap trends to design targeted welfare initiatives,
                        seminars, and leadership programs that complement future employability.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Users} color="blue" label="Total Students" value={byLabel('Total Students')} />
                    <StatTile icon={Target} color="green" label="Career Readiness" value={byLabel('Career Readiness')} sub="Assessment average" />
                    <StatTile icon={Activity} color="amber" label="Skill-Gap Alerts" value={byLabel('Skill-Gap Alerts')} sub="Flagged this term" />
                    <StatTile icon={GraduationCap} color="violet" label="Active Scholarships" value={byLabel('Active Scholarships')} sub="Current recipients" />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-1 text-base font-semibold text-foreground">Career Readiness by Program</h2>
                    <p className="mb-4 text-sm text-muted-foreground">Where to focus co-curricular and welfare initiatives.</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={placementByProgram} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                <Bar dataKey="rate" name="Readiness %" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground">Student Services</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href="/admin/users" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Student Records</Link>
                        <Link href="/scholarships" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Scholarships</Link>
                        <Link href="/events" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Student Events</Link>
                        <Link href="/clearance" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Clearance &amp; Records</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

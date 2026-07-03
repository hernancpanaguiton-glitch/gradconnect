import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { skillRadar } from '@/lib/demoData';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart2, Briefcase, Target } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function StudentDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
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
                        <p className="mt-1 text-muted-foreground">Prepare for your career journey after graduation.</p>
                    </div>
                    <Link href={route('jobs.index')} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
                        Browse Opportunities
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatTile icon={Target} color="blue" label="Profile Completion" value={byLabel('Profile Completion')} />
                    <StatTile icon={BarChart2} color="violet" label="Skills Listed" value={byLabel('Skills Listed')} />
                    <StatTile icon={Briefcase} color="green" label="Open Positions" value={byLabel('Open Positions')} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <h2 className="mb-1 text-base font-semibold text-foreground">Your Skills vs Market Demand</h2>
                        <p className="mb-2 text-sm text-muted-foreground">Where to focus before you graduate.</p>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={skillRadar} outerRadius="72%">
                                    <PolarGrid stroke="var(--border)" />
                                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <Radar name="You" dataKey="you" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
                                    <Radar name="Market" dataKey="market" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.12} />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                        <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-200">Get Started</h2>
                        <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">Complete these to unlock better job matches.</p>
                        <ul className="mt-4 space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                            <li>• Fill in your profile &amp; skills</li>
                            <li>• Upload a résumé for AI analysis</li>
                            <li>• Explore recommended internships</li>
                            <li>• Answer open readiness surveys</li>
                        </ul>
                        <Link href={route('graduate.profile.edit')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                            Build Your Profile
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

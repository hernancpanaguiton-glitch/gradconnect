import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart2, Briefcase, CheckCircle2, Target } from 'lucide-react';

interface RankedSkill { skill: string; count: number; percent: number }
interface SkillPreview { gaps: RankedSkill[]; strengths: RankedSkill[]; hasMatches: boolean }

export default function StudentDashboard({ stats, skillPreview }: PageProps<{ stats: Stat[]; skillPreview: SkillPreview }>) {
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
                        <h2 className="mb-1 text-base font-semibold text-foreground">Skills vs. Job Matches</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Ranked from how often each skill shows up across your AI job matches.{' '}
                            <Link href={route('skill-gap')} className="font-medium text-primary hover:underline">Full analysis →</Link>
                        </p>
                        {!skillPreview.hasMatches ? (
                            <p className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                                Upload a résumé to start generating AI job matches.
                            </p>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <AlertTriangle size={14} className="text-amber-500" /> Priority gaps
                                    </div>
                                    <ul className="space-y-1.5">
                                        {skillPreview.gaps.length === 0 && <li className="text-sm text-muted-foreground">None found.</li>}
                                        {skillPreview.gaps.map((s) => (
                                            <li key={s.skill} className="flex items-center justify-between text-sm">
                                                <span className="text-foreground">{s.skill}</span>
                                                <span className="text-amber-600 dark:text-amber-400">{s.percent}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <CheckCircle2 size={14} className="text-emerald-500" /> Your strengths
                                    </div>
                                    <ul className="space-y-1.5">
                                        {skillPreview.strengths.length === 0 && <li className="text-sm text-muted-foreground">None found.</li>}
                                        {skillPreview.strengths.map((s) => (
                                            <li key={s.skill} className="flex items-center justify-between text-sm">
                                                <span className="text-foreground">{s.skill}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400">{s.percent}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
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

import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface RankedSkill {
    skill: string;
    count: number;
    percent: number;
}

interface Props {
    hasProfile: boolean;
    hasMatches: boolean;
    gaps: RankedSkill[];
    strengths: RankedSkill[];
    coverage: number | null;
    totalMatches: number;
    yourSkills: string[];
}

function RankedList({ items, tone }: { items: RankedSkill[]; tone: 'gap' | 'strength' }) {
    const barClass = tone === 'gap' ? 'bg-amber-500' : 'bg-emerald-500';
    const textClass = tone === 'gap' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

    return (
        <div className="space-y-4">
            {items.map((s) => (
                <div key={s.skill}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{s.skill}</span>
                        <span className={textClass}>
                            {s.count} of your {s.count === 1 ? 'match' : 'matches'} ({s.percent}%)
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(s.percent, 4)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SkillGap({ hasProfile, hasMatches, gaps, strengths, coverage, totalMatches, yourSkills }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Skill Gap Analysis" />
            <div className="space-y-6">
                <PageHeader
                    icon={Target}
                    title="Skill Gap Analysis"
                    subtitle="Built from your AI job matches: how often each skill shows up as something you already have vs. something a role still asks for."
                />

                {!hasProfile && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">
                            Complete your graduate profile first so we have something to match against job postings.
                        </p>
                        <Link href={route('graduate.profile.edit')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Complete My Profile
                        </Link>
                    </div>
                )}

                {hasProfile && !hasMatches && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">
                            No AI job matches yet. Upload a résumé and check back once matching finishes —
                            skill gaps are computed from your matched jobs.
                        </p>
                        <Link href={route('resume-analysis')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Upload a Résumé
                        </Link>
                    </div>
                )}

                {hasProfile && hasMatches && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jobs Matched</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">{totalMatches}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill Coverage</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">{coverage ?? '—'}{coverage !== null && '%'}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Share of skills employers asked for that you already have</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills on Your Profile</p>
                                <p className="mt-1 text-2xl font-bold text-foreground">{yourSkills.length}</p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500" />
                                    <h2 className="font-semibold text-foreground">Priority skills to build</h2>
                                </div>
                                {gaps.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No recurring gaps found — your matched jobs haven't flagged missing skills.</p>
                                ) : (
                                    <RankedList items={gaps} tone="gap" />
                                )}
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <h2 className="font-semibold text-foreground">Your matched strengths</h2>
                                </div>
                                {strengths.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No matched skills recorded yet.</p>
                                ) : (
                                    <RankedList items={strengths} tone="strength" />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

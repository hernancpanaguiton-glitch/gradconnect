import PageHeader from '@/Components/PageHeader';
import ProgressRing from '@/Components/ProgressRing';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, FileText, Info, Sparkles, TriangleAlert, Upload } from 'lucide-react';

interface Keyword { label: string; match: boolean }
interface Discrepancy { severity: 'warning' | 'info'; title: string; detail: string }

interface Props {
    hasResume: boolean;
    resumeName?: string;
    resumeStatus?: string;
    score?: number;
    strengths?: string[];
    suggestions?: string[];
    keywords?: Keyword[];
    discrepancies?: Discrepancy[];
    poweredByAi?: boolean;
}

const SEVERITY = {
    warning: { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', icon: TriangleAlert, iconColor: 'text-amber-500' },
    info: { chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', icon: Info, iconColor: 'text-sky-500' },
};

function scoreLabel(score: number): string {
    if (score >= 85) return 'Excellent — your résumé is job-ready.';
    if (score >= 70) return 'Good — a few tweaks will push you into the top tier.';
    if (score >= 50) return 'Fair — several improvements recommended.';
    return 'Needs work — follow the suggestions below.';
}

export default function ResumeAnalysis({
    hasResume, resumeName, resumeStatus, score = 0,
    strengths = [], suggestions = [], keywords = [], discrepancies = [], poweredByAi = false,
}: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="AI Resume Analysis" />
            <div className="space-y-6">
                <PageHeader
                    icon={FileText}
                    title="AI Resume Analysis"
                    subtitle="An AI review of your résumé — overall score, strengths, targeted suggestions, and consistency checks against your profile."
                    action={hasResume ? (
                        <Link href={route('resumes.index')} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            <Upload size={16} /> Manage résumés
                        </Link>
                    ) : undefined}
                />

                {!hasResume ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
                        <FileText size={40} className="mx-auto text-muted-foreground" />
                        <h2 className="mt-4 text-lg font-semibold text-foreground">No résumé to analyze yet</h2>
                        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                            Upload a résumé (PDF, DOCX, or TXT) to get an AI analysis and see how it lines up with your profile.
                        </p>
                        <Link href={route('resumes.index')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            <Upload size={16} /> Upload résumé
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Discrepancies — flagged first */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="font-semibold text-foreground">Profile ↔ résumé consistency</h2>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${discrepancies.length === 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                                    {discrepancies.length === 0 ? 'No issues' : `${discrepancies.length} flagged`}
                                </span>
                            </div>
                            {discrepancies.length === 0 ? (
                                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={16} /> Your résumé and profile are consistent.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {discrepancies.map((d, i) => {
                                        const s = SEVERITY[d.severity];
                                        return (
                                            <li key={i} className="flex gap-3 rounded-lg border border-border p-3">
                                                <s.icon size={18} className={`mt-0.5 shrink-0 ${s.iconColor}`} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${s.chip}`}>{d.severity}</span>
                                                    </div>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">{d.detail}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
                                <ProgressRing value={score} label="Résumé Score" />
                                <p className="mt-4 text-center text-sm text-muted-foreground">{scoreLabel(score)}</p>
                                <span className="mt-3 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {poweredByAi ? '✨ AI analysis' : 'Heuristic analysis'}
                                </span>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={18} /><h2 className="font-semibold text-foreground">Strengths</h2>
                                </div>
                                <ul className="space-y-2">
                                    {strengths.map((s, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Sparkles size={18} /><h2 className="font-semibold text-foreground">Suggestions</h2>
                                </div>
                                <ul className="space-y-2">
                                    {suggestions.map((s, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                            <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {keywords.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <h2 className="mb-1 font-semibold text-foreground">Skill keyword coverage</h2>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Which of your profile skills appear in <span className="font-medium text-foreground">{resumeName}</span>
                                    {resumeStatus && resumeStatus !== 'done' && <span className="ml-2 text-amber-600">· résumé still processing</span>}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((k) => (
                                        <span key={k.label}
                                            className={`rounded-full px-3 py-1 text-sm font-medium ${k.match ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                            {k.match ? '✓ ' : '+ '}{k.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

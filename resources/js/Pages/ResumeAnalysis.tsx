import PageHeader from '@/Components/PageHeader';
import ProgressRing from '@/Components/ProgressRing';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CheckCircle2, FileText, Sparkles, TriangleAlert, Upload } from 'lucide-react';

const STRENGTHS = [
    'Clear, quantified achievements in each role',
    'Strong technical keyword coverage for backend roles',
    'Consistent formatting and reverse-chronological order',
    'Relevant certifications listed near the top',
];
const IMPROVEMENTS = [
    'Add a concise professional summary at the top',
    'Include measurable impact for your latest project',
    'Add cloud/DevOps keywords (Docker, CI/CD)',
    'Trim to 1–2 pages for readability',
];
const KEYWORDS = [
    { label: 'JavaScript', match: true }, { label: 'React', match: true },
    { label: 'Node.js', match: true }, { label: 'SQL', match: true },
    { label: 'Docker', match: false }, { label: 'AWS', match: false },
    { label: 'REST API', match: true }, { label: 'TypeScript', match: false },
];

export default function ResumeAnalysis() {
    return (
        <AuthenticatedLayout>
            <Head title="AI Resume Analysis" />
            <div className="space-y-6">
                <PageHeader
                    icon={FileText}
                    title="AI Resume Analysis"
                    subtitle="An AI review of your résumé — overall score, strengths, and targeted suggestions to improve your match rate."
                    action={(
                        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            <Upload size={16} /> Re-analyze résumé
                        </button>
                    )}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
                        <ProgressRing value={78} label="Résumé Score" />
                        <p className="mt-4 text-center text-sm text-muted-foreground">Good — a few tweaks will push you into the top tier.</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={18} /><h2 className="font-semibold text-foreground">Strengths</h2>
                        </div>
                        <ul className="space-y-2">
                            {STRENGTHS.map((s) => (
                                <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <TriangleAlert size={18} /><h2 className="font-semibold text-foreground">Suggestions</h2>
                        </div>
                        <ul className="space-y-2">
                            {IMPROVEMENTS.map((s) => (
                                <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                                    <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />{s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-foreground">Keyword match vs. target roles</h2>
                    <div className="flex flex-wrap gap-2">
                        {KEYWORDS.map((k) => (
                            <span key={k.label}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${k.match ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                {k.match ? '✓ ' : '+ '}{k.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

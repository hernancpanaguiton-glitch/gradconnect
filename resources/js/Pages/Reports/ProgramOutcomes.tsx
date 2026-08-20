import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';

interface SkillGap { skill: string; count: number }
interface EmploymentBreakdown {
    employed?: number; unemployed?: number; self_employed?: number;
    further_study?: number; not_seeking?: number;
}
const LABELS: Record<string, string> = {
    employed: 'Employed', unemployed: 'Unemployed', self_employed: 'Self-Employed',
    further_study: 'Further Study', not_seeking: 'Not Seeking',
};
const COMPETENCY_LABELS: Record<string, string> = {
    technical_skills: 'Technical Skills', communication: 'Communication',
    problem_solving: 'Problem-Solving', teamwork: 'Teamwork', adaptability: 'Adaptability',
};

interface Props extends PageProps {
    totalGraduates: number;
    employmentBreakdown: EmploymentBreakdown;
    jobRelevanceRate: number | null;
    topSkillGaps: SkillGap[];
    competencyAverages: Record<string, number>;
    feedbackCount: number;
    hasDepartment: boolean;
}

export default function ProgramOutcomes({
    totalGraduates, employmentBreakdown, jobRelevanceRate,
    topSkillGaps, competencyAverages, feedbackCount, hasDepartment,
}: Props) {
    if (!hasDepartment) {
        return (
            <AuthenticatedLayout>
                <Head title="Program Outcomes" />
                <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                    <p className="text-muted-foreground">Assign your college from your dashboard first, so this report can scope to your programs.</p>
                    <Link href={route('dashboard')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                        Go to Dashboard
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const maxGapCount = Math.max(1, ...topSkillGaps.map((g) => g.count));

    return (
        <AuthenticatedLayout>
            <Head title="Program Outcomes" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Program Outcomes</h1>
                        <p className="mt-1 max-w-2xl text-gray-500">
                            Skill gaps and employer-rated competencies for your programs — evidence for curriculum improvement,
                            program effectiveness review, and accreditation support.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Printer size={16} /> Print / Save as PDF
                        </button>
                        <a href={route('reports.program-outcomes.export')}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            <Download size={16} /> Export CSV
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Total Graduates</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{totalGraduates}</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Job-Relevant Employment</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{jobRelevanceRate ?? '—'}{jobRelevanceRate !== null && '%'}</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Employer Feedback Collected</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{feedbackCount}</p>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Employment Status Breakdown</h2>
                    <div className="space-y-2">
                        {Object.entries(employmentBreakdown).map(([key, count]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{LABELS[key] ?? key}</span>
                                <span className="text-gray-500">{count}</span>
                            </div>
                        ))}
                        {Object.keys(employmentBreakdown).length === 0 && (
                            <p className="text-sm text-gray-400">No employment data for your programs yet.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Most Common Skill Gaps</h2>
                    <p className="mb-4 text-xs text-gray-400">Ranked by how often your graduates' AI job matches flagged each skill as missing.</p>
                    <div className="space-y-3">
                        {topSkillGaps.map((gap) => (
                            <div key={gap.skill}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-800">{gap.skill}</span>
                                    <span className="text-gray-500">{gap.count}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(gap.count / maxGapCount) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                        {topSkillGaps.length === 0 && (
                            <p className="text-sm text-gray-400">No AI job matches with skill gaps recorded yet for your programs.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Employer-Rated Competencies</h2>
                    <p className="mb-4 text-xs text-gray-400">Average rating (out of 5) from employer feedback on hired/rejected candidates.</p>
                    <div className="space-y-3">
                        {Object.entries(competencyAverages).map(([key, avg]) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-800">{COMPETENCY_LABELS[key] ?? key}</span>
                                    <span className="text-gray-500">{avg.toFixed(1)} / 5</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(avg / 5) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                        {Object.keys(competencyAverages).length === 0 && (
                            <p className="text-sm text-gray-400">No employer feedback submitted yet for your programs.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

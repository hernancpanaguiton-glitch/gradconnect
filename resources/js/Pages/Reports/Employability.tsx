import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

interface College { id: number; name: string }
interface Program { id: number; name: string; parent_id: number | null }
interface SurveyRate { id: number; title: string; submitted: number; eligible: number; responseRate: number }
interface Filters { college_id: number | null; program_id: number | null; graduation_year: number | null }
interface EmploymentBreakdown {
    employed?: number; unemployed?: number; self_employed?: number;
    further_study?: number; not_seeking?: number;
}
interface Props extends PageProps {
    totalGraduates: number;
    employmentBreakdown: EmploymentBreakdown;
    willingToRelocate: number;
    jobRelevanceRate: number | null;
    salaryDistribution: Record<string, number>;
    avgTimeToEmploymentMonths: number | null;
    surveyResponseRates: SurveyRate[];
    colleges: College[];
    programs: Program[];
    scopeLocked: boolean;
    scopeLabel: string | null;
    filters: Filters;
}

const LABELS: Record<string, string> = {
    employed: 'Employed', unemployed: 'Unemployed', self_employed: 'Self-Employed',
    further_study: 'Further Study', not_seeking: 'Not Seeking',
};
const COLORS: Record<string, string> = {
    employed: 'bg-green-500', unemployed: 'bg-red-400', self_employed: 'bg-blue-400',
    further_study: 'bg-yellow-400', not_seeking: 'bg-gray-300',
};
/** Long enough to cover typing a four-digit year without a pause. */
const YEAR_DEBOUNCE_MS = 400;

export default function EmployabilityReport({
    totalGraduates, employmentBreakdown, willingToRelocate, jobRelevanceRate,
    salaryDistribution, avgTimeToEmploymentMonths, surveyResponseRates,
    colleges, programs, scopeLocked, scopeLabel, filters,
}: Props) {
    const employed = employmentBreakdown.employed ?? 0;
    const employmentRate = totalGraduates > 0 ? Math.round((employed / totalGraduates) * 100) : 0;
    const relocateRate = totalGraduates > 0 ? Math.round((willingToRelocate / totalGraduates) * 100) : 0;
    const visiblePrograms = filters.college_id ? programs.filter((p) => p.parent_id === filters.college_id) : programs;
    const appliedYear = filters.graduation_year !== null ? String(filters.graduation_year) : '';
    const [yearDraft, setYearDraft] = useState(appliedYear);

    function updateFilter(key: keyof Filters, value: string) {
        const next = { ...filters, [key]: value ? Number(value) : null };
        if (key === 'college_id') next.program_id = null;
        router.get(route('reports.employability'), next as unknown as Record<string, string>, { preserveState: true, preserveScroll: true });
    }

    // The server's echo of the applied filter wins on a fresh visit — the back
    // button, or a college change that reset the rest.
    useEffect(() => {
        setYearDraft(appliedYear);
    }, [appliedYear]);

    // Every keystroke of a year used to be a full report recomputation, four
    // of them for "2024", with the digits lagging behind the typing because
    // the input's value came back from the server. Only the pause at the end
    // is worth a round-trip.
    useEffect(() => {
        if (yearDraft === appliedYear) return;

        const timer = setTimeout(() => updateFilter('graduation_year', yearDraft), YEAR_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [yearDraft, appliedYear]);

    function exportUrl(): string {
        const params = new URLSearchParams();
        if (filters.college_id) params.set('college_id', String(filters.college_id));
        if (filters.program_id) params.set('program_id', String(filters.program_id));
        if (filters.graduation_year) params.set('graduation_year', String(filters.graduation_year));
        return `${route('reports.employability.export')}?${params.toString()}`;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Employability Report" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Employability Report</h1>
                        <p className="mt-1 text-gray-500">Graduate employment statistics</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Printer size={16} /> Print / Save as PDF
                        </button>
                        <a href={exportUrl()}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            <Download size={16} /> Export CSV
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    {scopeLocked ? (
                        <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
                            Scoped to <strong>{scopeLabel}</strong>
                        </span>
                    ) : (
                        <>
                            <select value={filters.college_id ?? ''} onChange={(e) => updateFilter('college_id', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="">All Colleges</option>
                                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={filters.program_id ?? ''} onChange={(e) => updateFilter('program_id', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="">All Programs</option>
                                {visiblePrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </>
                    )}
                    <input type="number" placeholder="Graduation Year" value={yearDraft}
                        onChange={(e) => setYearDraft(e.target.value)}
                        className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Total Graduates</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{totalGraduates}</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Employment Rate</p>
                        <p className="mt-1 text-3xl font-bold text-green-600">{employmentRate}%</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Willing to Relocate</p>
                        <p className="mt-1 text-3xl font-bold text-indigo-600">{relocateRate}%</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Job-Relevant Employment</p>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{jobRelevanceRate ?? '—'}{jobRelevanceRate !== null && '%'}</p>
                        <p className="mt-1 text-xs text-gray-400">Current job related to their course</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Avg. Time to Employment</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{avgTimeToEmploymentMonths ?? '—'}{avgTimeToEmploymentMonths !== null && ' mo'}</p>
                        <p className="mt-1 text-xs text-gray-400">From graduation year to first job</p>
                    </div>
                </div>

                {/* Employment Breakdown */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Employment Status Breakdown</h2>
                    <div className="space-y-3">
                        {Object.entries(employmentBreakdown).map(([key, count]) => {
                            const pct = totalGraduates > 0 ? Math.round((count / totalGraduates) * 100) : 0;
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-700">{LABELS[key] ?? key}</span>
                                        <span className="text-gray-500">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${COLORS[key] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(employmentBreakdown).length === 0 && (
                            <p className="text-sm text-gray-400">No employment status data for this filter.</p>
                        )}
                    </div>
                </div>

                {Object.keys(salaryDistribution).length > 0 && (
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Salary Range Distribution</h2>
                        <div className="space-y-2">
                            {Object.entries(salaryDistribution).map(([range, count]) => (
                                <div key={range} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{range}</span>
                                    <span className="text-gray-500">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {surveyResponseRates.length > 0 && (
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tracer &amp; Employability Survey Response Rates</h2>
                        <div className="space-y-3">
                            {surveyResponseRates.map((s) => (
                                <div key={s.id}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-700">{s.title}</span>
                                        <span className="text-gray-500">{s.submitted}/{s.eligible} ({s.responseRate}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.responseRate}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-400 text-right">
                    Data reflects registered graduate profiles matching the selected filters, updated in real time.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}

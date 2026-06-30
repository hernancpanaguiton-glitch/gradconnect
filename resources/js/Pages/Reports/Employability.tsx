import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

interface EmploymentBreakdown {
    employed: number; unemployed: number; self_employed: number;
    further_study: number; not_seeking: number;
}
interface Props extends PageProps {
    totalGraduates: number;
    employmentBreakdown: EmploymentBreakdown;
    willingToRelocate: number;
}

const LABELS: Record<string, string> = {
    employed: 'Employed', unemployed: 'Unemployed', self_employed: 'Self-Employed',
    further_study: 'Further Study', not_seeking: 'Not Seeking',
};
const COLORS: Record<string, string> = {
    employed: 'bg-green-500', unemployed: 'bg-red-400', self_employed: 'bg-blue-400',
    further_study: 'bg-yellow-400', not_seeking: 'bg-gray-300',
};

export default function EmployabilityReport({ totalGraduates, employmentBreakdown, willingToRelocate }: Props) {
    const employed = employmentBreakdown.employed ?? 0;
    const employmentRate = totalGraduates > 0 ? Math.round((employed / totalGraduates) * 100) : 0;
    const relocateRate = totalGraduates > 0 ? Math.round((willingToRelocate / totalGraduates) * 100) : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Employability Report" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employability Report</h1>
                    <p className="mt-1 text-gray-500">Graduate employment statistics</p>
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
                    </div>
                </div>

                <p className="text-xs text-gray-400 text-right">
                    Data reflects all registered graduate profiles. Updated in real-time.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}

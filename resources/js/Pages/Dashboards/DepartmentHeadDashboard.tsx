import StatCard, { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface College { id: number; name: string; code: string | null }

export default function DepartmentHeadDashboard({ stats, colleges }: PageProps<{ stats: Stat[]; colleges: College[] }>) {
    const { auth } = usePage<PageProps>().props;
    const currentCollegeId = auth.user.department?.id ?? null;

    function selectCollege(value: string) {
        router.patch(route('department-head.college.update'), { department_id: value || null }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Department Head</h1>
                        <p className="mt-1 text-gray-500">
                            Monitor employment statistics and program outcomes for your college.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Your College</label>
                        <select
                            value={currentCollegeId ? String(currentCollegeId) : ''}
                            onChange={(e) => selectCollege(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            <option value="">— Select your college —</option>
                            {colleges.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {!currentCollegeId && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                        Select your college above to see analytics scoped to your graduates.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Reports</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('reports.employability')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            Employability Report
                        </Link>
                        <a href="#" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Graduate Profiles
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

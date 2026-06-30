import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function DepartmentHeadDashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Department Head</h1>
                    <p className="mt-1 text-gray-500">
                        Monitor employment statistics and program outcomes for your department.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Graduates</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">In your department</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Employment Rate</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">Based on tracer data</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Related Employment</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">Jobs related to degree</p>
                    </div>
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

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function AlumniAffairsDashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Alumni Affairs Office
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Manage alumni records, surveys, and employability programs.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Total Alumni</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Active Surveys</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Survey Responses</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">This month</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Employment Rate</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">Based on tracer data</p>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <a href="/surveys/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            Create Survey
                        </a>
                        <a href="/surveys" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Manage Surveys
                        </a>
                        <a href="/reports/employability" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Employability Report
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

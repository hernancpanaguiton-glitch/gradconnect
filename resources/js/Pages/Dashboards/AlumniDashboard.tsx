import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

export default function AlumniDashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user.first_name}!
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Here's an overview of your career journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Profile Completion" value="—" sub="Complete your profile" />
                    <StatCard label="Job Recommendations" value="—" sub="Based on your profile" />
                    <StatCard label="Applications" value="—" sub="Active applications" />
                    <StatCard label="Pending Surveys" value="—" sub="Waiting for response" />
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <a href="/me/profile" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            Update Profile
                        </a>
                        <a href="/resumes" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Manage Resumes
                        </a>
                        <a href="/jobs" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Browse Jobs
                        </a>
                        <a href="/recommendations" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            View Recommendations
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

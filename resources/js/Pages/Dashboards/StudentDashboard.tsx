import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function StudentDashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome, {user.first_name}!
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Prepare for your career journey after graduation.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Profile Completion</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Skills Listed</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <p className="text-sm text-gray-500">Open Positions</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
                        <p className="text-xs text-gray-400">Internships & jobs</p>
                    </div>
                </div>

                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6">
                    <h2 className="text-base font-semibold text-indigo-900">Get Started</h2>
                    <p className="mt-1 text-sm text-indigo-700">
                        Complete your career profile to unlock job matches and recommendations.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <a href="/me/profile" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            Build Your Profile
                        </a>
                        <a href="/jobs" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 transition-colors">
                            Browse Opportunities
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

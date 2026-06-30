import StatCard, { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function AdminDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
                    <p className="mt-1 text-gray-500">
                        Manage users, roles, job moderation, and system configuration.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <h2 className="text-base font-semibold text-gray-900">User Management</h2>
                        <p className="mt-1 text-sm text-gray-500">Manage accounts, status, and role assignments.</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link href={route('admin.users.index')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                                Manage Users
                            </Link>
                            <Link href={route('admin.roles.index')} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                                Roles & Permissions
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <h2 className="text-base font-semibold text-gray-900">Job Moderation</h2>
                        <p className="mt-1 text-sm text-gray-500">Review and approve industry partner job postings.</p>
                        <div className="mt-4">
                            <a href="#" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                                Review Postings
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import StatCard, { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function IndustryPartnerDashboard({ stats }: PageProps<{ stats: Stat[] }>) {
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
                        Manage your postings and discover talented graduates.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('postings.create')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                            Post a Job
                        </Link>
                        <Link href={route('postings.index')} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            My Postings
                        </Link>
                        <Link href={route('company.edit')} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors">
                            Company Profile
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

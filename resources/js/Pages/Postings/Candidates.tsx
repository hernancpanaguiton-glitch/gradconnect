import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Applicant {
    id: number; status: string; applied_at: string | null; cover_letter: string | null;
    graduate_profile: { id: number; user: { name: string; email: string }; current_employment_status: string | null };
    resume: { id: number; original_filename: string } | null;
}
interface Posting { id: number; title: string }
interface Props extends PageProps { posting: Posting; applications: { data: Applicant[]; total: number } }

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-emerald-100 text-emerald-700',
    withdrawn: 'bg-gray-100 text-gray-600',
};

export default function Candidates({ posting, applications }: Props) {
    function updateStatus(appId: number, status: string) {
        router.patch(route('applications.update-status', appId), { status }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Candidates — ${posting.title}`} />
            <div className="space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Postings</Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{posting.title}</h1>
                        <p className="text-gray-500 text-sm">{applications.total} applicant(s)</p>
                    </div>
                </div>
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Applied</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {applications.data.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{app.graduate_profile.user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{app.graduate_profile.user.email}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[app.status] ?? 'bg-gray-100'}`}>
                                            {app.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            value={app.status}
                                            onChange={(e) => updateStatus(app.id, e.target.value)}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            {['submitted','under_review','shortlisted','rejected','hired'].map((s) => (
                                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {applications.data.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No applications yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

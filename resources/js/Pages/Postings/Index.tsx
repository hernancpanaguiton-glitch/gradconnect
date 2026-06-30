import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface Posting {
    id: number; title: string; employment_type: string; location: string | null;
    is_remote: boolean; status: string; applications_count: number; created_at: string;
}
interface Company { id: number; name: string; is_verified: boolean }
interface Props extends PageProps {
    company: Company;
    postings: { data: Posting[]; total: number };
}

const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    closed: 'bg-red-100 text-red-700',
};

export default function PostingsIndex({ company, postings }: Props) {
    const { flash } = usePage<Props>().props;

    function destroy(id: number, title: string) {
        if (!confirm(`Delete "${title}"?`)) return;
        router.delete(route('postings.destroy', id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="My Job Postings" />

            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
                        <p className="mt-1 text-gray-500">{company.name} · {postings.total} postings</p>
                    </div>
                    <Link href={route('postings.create')}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + New Posting
                    </Link>
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Applicants</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {postings.data.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                                    <td className="px-4 py-3 text-gray-600 capitalize">{p.employment_type.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-3 text-gray-500">{p.is_remote ? 'Remote' : (p.location ?? '—')}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link href={route('postings.candidates', p.id)} className="font-medium text-indigo-600 hover:text-indigo-800">
                                            {p.applications_count}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-3">
                                            <Link href={route('postings.matches', p.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Matches</Link>
                                            <Link href={route('postings.edit', p.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</Link>
                                            <button onClick={() => destroy(p.id, p.title)} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {postings.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No job postings yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

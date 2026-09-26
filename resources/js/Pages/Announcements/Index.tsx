import { roleAudienceLabel } from '@/lib/roles';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Announcement {
    id: number;
    title: string;
    body: string;
    audience: string | null;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
    created_by: { name: string };
}
interface Props extends PageProps { announcements: Announcement[] }

export default function AnnouncementsIndex({ announcements }: Props) {
    function destroy(id: number) {
        if (!confirm('Delete this announcement?')) return;
        router.delete(route('announcements.destroy', id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Announcements" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                        <p className="mt-1 text-gray-500">{announcements.length} announcement(s)</p>
                    </div>
                    <Link href={route('announcements.create')}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + New Announcement
                    </Link>
                </div>

                <div className="space-y-3">
                    {announcements.map((a) => (
                        <div key={a.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {a.status}
                                        </span>
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                            {a.audience ? roleAudienceLabel(a.audience) : 'Everyone'}
                                        </span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{a.body}</p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        By {a.created_by.name} · {new Date(a.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link href={route('announcements.edit', a.id)}
                                        className="rounded-lg px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                                        Edit
                                    </Link>
                                    <button onClick={() => destroy(a.id)}
                                        className="rounded-lg px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <p className="text-center py-12 text-gray-400">No announcements yet.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

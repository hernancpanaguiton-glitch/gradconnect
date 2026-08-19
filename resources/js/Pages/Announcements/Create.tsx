import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props extends PageProps {}

const AUDIENCES = [
    { value: '', label: 'Everyone' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'student', label: 'Graduate Students' },
    { value: 'industry_partner', label: 'Industry Partners' },
    { value: 'alumni_affairs', label: 'Alumni Affairs Office' },
    { value: 'department_head', label: 'Department Heads' },
    { value: 'sao', label: 'Student Affairs Office' },
    { value: 'admin', label: 'Admins' },
];

export default function AnnouncementCreate({}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string; body: string; audience: string; status: 'draft' | 'published';
    }>({ title: '', body: '', audience: '', status: 'published' });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(route('announcements.store'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="New Announcement" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('announcements.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Announcements</Link>
                    <h1 className="text-2xl font-bold text-gray-900">New Announcement</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                            <textarea value={data.body} onChange={(e) => setData('body', e.target.value)} rows={6}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                                <select value={data.audience} onChange={(e) => setData('audience', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={data.status} onChange={(e) => setData('status', e.target.value as 'draft' | 'published')}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="published">Publish now (notifies the audience)</option>
                                    <option value="draft">Save as draft</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Link href={route('announcements.index')} className="rounded-lg px-4 py-2 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Announcement
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

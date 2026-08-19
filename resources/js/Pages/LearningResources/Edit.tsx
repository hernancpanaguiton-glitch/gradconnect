import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Department { id: number; name: string }
interface Skill { id: number; name: string; category: string | null }
interface ResourceModel {
    id: number; title: string; type: string; provider: string | null; url: string | null;
    description: string | null; department_id: number | null; skills: Array<{ id: number }>;
}
interface Props extends PageProps { resource: ResourceModel; departments: Department[]; skills: Skill[] }

const TYPES = [
    { value: 'training', label: 'Training' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'certification', label: 'Certification' },
    { value: 'course', label: 'Course' },
    { value: 'article', label: 'Article' },
    { value: 'link', label: 'Link' },
];

export default function LearningResourceEdit({ resource, departments, skills }: Props) {
    const { data, setData, patch, processing, errors } = useForm<{
        title: string; type: string; provider: string; url: string; description: string;
        department_id: string; skill_ids: number[];
    }>({
        title: resource.title, type: resource.type, provider: resource.provider ?? '',
        url: resource.url ?? '', description: resource.description ?? '',
        department_id: resource.department_id ? String(resource.department_id) : '',
        skill_ids: resource.skills.map((s) => s.id),
    });

    function toggleSkill(id: number) {
        setData('skill_ids', data.skill_ids.includes(id) ? data.skill_ids.filter((s) => s !== id) : [...data.skill_ids, id]);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('learning-resources.update', resource.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Edit Learning Resource" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('learning-resources.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Learning Resources</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Resource</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                                <input type="text" value={data.provider} onChange={(e) => setData('provider', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                            <input type="url" value={data.url} onChange={(e) => setData('url', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restrict to Program (optional)</label>
                            <select value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="">Everyone</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Addresses which skills?</label>
                            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-3">
                                {skills.map((s) => (
                                    <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${data.skill_ids.includes(s.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Link href={route('learning-resources.index')} className="rounded-lg px-4 py-2 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

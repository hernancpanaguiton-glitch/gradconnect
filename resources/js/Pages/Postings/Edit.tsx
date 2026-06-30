import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Skill { id: number; name: string; category: string | null }
interface PostingSkill extends Skill { pivot: { is_required: boolean; weight: number } }
interface Posting {
    id: number; title: string; description: string; responsibilities: string | null;
    qualifications: string | null; employment_type: string; location: string | null;
    is_remote: boolean; salary_range: string | null; status: string;
    application_deadline: string | null;
    skills: PostingSkill[];
}
interface Props extends PageProps { posting: Posting; skills: Skill[] }
interface SkillPivot { id: number; is_required: boolean; weight: number }

export default function PostingEdit({ posting, skills }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        title: posting.title,
        description: posting.description,
        responsibilities: posting.responsibilities ?? '',
        qualifications: posting.qualifications ?? '',
        employment_type: posting.employment_type,
        location: posting.location ?? '',
        is_remote: posting.is_remote,
        salary_range: posting.salary_range ?? '',
        status: posting.status,
        application_deadline: posting.application_deadline ?? '',
        skills: posting.skills.map((s): SkillPivot => ({
            id: s.id, is_required: s.pivot.is_required, weight: s.pivot.weight,
        })),
    });

    function toggleSkill(skill: Skill) {
        const exists = data.skills.find((s) => s.id === skill.id);
        setData('skills', exists
            ? data.skills.filter((s) => s.id !== skill.id)
            : [...data.skills, { id: skill.id, is_required: true, weight: 3 }]);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('postings.update', posting.id));
    }

    const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
        const cat = s.category ?? 'Other';
        acc[cat] = [...(acc[cat] ?? []), s];
        return acc;
    }, {});

    return (
        <AuthenticatedLayout>
            <Head title="Edit Posting" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Posting</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={data.employment_type} onChange={(e) => setData('employment_type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {['full_time','part_time','contract','internship','freelance'].map((t) => (
                                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={data.status} onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    {['draft','open','closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={5}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                            <textarea value={data.qualifications} onChange={(e) => setData('qualifications', e.target.value)} rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <p className="text-sm font-medium text-gray-700">Skills ({data.skills.length} selected)</p>
                        {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                            <div key={cat}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{cat}</p>
                                <div className="flex flex-wrap gap-2">
                                    {catSkills.map((skill) => {
                                        const selected = data.skills.some((s) => s.id === skill.id);
                                        return (
                                            <button key={skill.id} type="button" onClick={() => toggleSkill(skill)}
                                                className={`rounded-full px-3 py-1 text-sm font-medium ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                                {skill.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Changes
                        </button>
                        <Link href={route('postings.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Skill { id: number; name: string; category: string | null }
interface Props extends PageProps { skills: Skill[] }

interface SkillPivot { id: number; is_required: boolean; weight: number }

export default function PostingCreate({ skills }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        responsibilities: '',
        qualifications: '',
        employment_type: 'full_time',
        location: '',
        is_remote: false,
        salary_range: '',
        experience_level: '',
        status: 'open',
        application_deadline: '',
        skills: [] as SkillPivot[],
    });

    function toggleSkill(skill: Skill) {
        const exists = data.skills.find((s) => s.id === skill.id);
        if (exists) {
            setData('skills', data.skills.filter((s) => s.id !== skill.id));
        } else {
            setData('skills', [...data.skills, { id: skill.id, is_required: true, weight: 3 }]);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(route('postings.store'));
    }

    const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
        const cat = s.category ?? 'Other';
        acc[cat] = [...(acc[cat] ?? []), s];
        return acc;
    }, {});

    return (
        <AuthenticatedLayout>
            <Head title="New Job Posting" />

            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-gray-900">New Job Posting</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                                <select value={data.employment_type} onChange={(e) => setData('employment_type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="full_time">Full-time</option>
                                    <option value="part_time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                    <option value="freelance">Freelance</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={data.status} onChange={(e) => setData('status', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="draft">Draft</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input type="text" value={data.location} onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Cebu City" disabled={data.is_remote}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                                <input type="text" value={data.salary_range} onChange={(e) => setData('salary_range', e.target.value)}
                                    placeholder="₱20,000 – ₱30,000/mo"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.is_remote} onChange={(e) => setData('is_remote', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <span className="text-sm text-gray-700">Remote position</span>
                        </label>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={5}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                            <textarea value={data.qualifications} onChange={(e) => setData('qualifications', e.target.value)} rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <p className="text-sm font-medium text-gray-700">Required Skills ({data.skills.length} selected)</p>
                        {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                            <div key={cat}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{cat}</p>
                                <div className="flex flex-wrap gap-2">
                                    {catSkills.map((skill) => {
                                        const selected = data.skills.some((s) => s.id === skill.id);
                                        return (
                                            <button key={skill.id} type="button" onClick={() => toggleSkill(skill)}
                                                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
                            Publish Posting
                        </button>
                        <Link href={route('postings.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

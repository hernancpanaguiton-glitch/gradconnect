import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface JobPosting {
    id: number; title: string; employment_type: string; location: string | null;
    is_remote: boolean; salary_range: string | null; status: string; created_at: string;
    company: { id: number; name: string; industry: string | null };
    skills: Array<{ id: number; name: string }>;
}
interface Props extends PageProps {
    postings: { data: JobPosting[]; total: number; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { search?: string; employment_type?: string; is_remote?: string };
}

export default function JobsIndex({ postings, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.employment_type ?? '');
    const [remote, setRemote] = useState(filters.is_remote === '1');

    function applyFilters(e: FormEvent) {
        e.preventDefault();
        router.get(route('jobs.index'), { search, employment_type: type, is_remote: remote ? '1' : '' }, { preserveState: true, replace: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Job Board" />
            <div className="space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
                    <p className="mt-1 text-gray-500">{postings.total} open positions</p>
                </div>

                {/* Filters */}
                <form onSubmit={applyFilters} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job title or keyword…"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            <option value="">All types</option>
                            <option value="full_time">Full-time</option>
                            <option value="part_time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="freelance">Freelance</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                        <span className="text-sm text-gray-700">Remote only</span>
                    </label>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Filter</button>
                </form>

                {/* Job cards */}
                <div className="space-y-3">
                    {postings.data.map((job) => (
                        <Link key={job.id} href={route('jobs.show', job.id)}
                            className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                                    <p className="text-sm text-gray-600 mt-0.5">{job.company.name}{job.company.industry ? ` · ${job.company.industry}` : ''}</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 capitalize">
                                            {job.employment_type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                            {job.is_remote ? 'Remote' : (job.location ?? 'On-site')}
                                        </span>
                                        {job.salary_range && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{job.salary_range}</span>}
                                    </div>
                                    {job.skills.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {job.skills.slice(0, 5).map((s) => (
                                                <span key={s.id} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">{s.name}</span>
                                            ))}
                                            {job.skills.length > 5 && <span className="text-xs text-gray-400">+{job.skills.length - 5}</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {postings.data.length === 0 && (
                        <p className="text-center py-12 text-gray-400">No open positions match your search.</p>
                    )}
                </div>

                {/* Pagination */}
                {postings.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {postings.links.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url}
                                    className={`rounded px-3 py-1.5 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded px-3 py-1.5 text-sm text-gray-300 ring-1 ring-gray-200" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

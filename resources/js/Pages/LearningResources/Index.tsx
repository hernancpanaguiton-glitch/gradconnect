import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';

interface Skill { id: number; name: string }
interface Resource {
    id: number; title: string; type: string; provider: string | null; url: string | null;
    description: string | null; department: { id: number; name: string } | null; skills: Skill[];
}
interface Props extends PageProps { resources: Resource[]; canManage: boolean }

const TYPE_LABELS: Record<string, string> = {
    training: 'Training', seminar: 'Seminar', certification: 'Certification',
    course: 'Course', article: 'Article', link: 'Link',
};
const TYPE_COLORS: Record<string, string> = {
    training: 'bg-indigo-50 text-indigo-700', seminar: 'bg-amber-50 text-amber-700',
    certification: 'bg-emerald-50 text-emerald-700', course: 'bg-blue-50 text-blue-700',
    article: 'bg-gray-100 text-gray-700', link: 'bg-gray-100 text-gray-700',
};

export default function LearningResourcesIndex({ resources, canManage }: Props) {
    function destroy(id: number) {
        if (!confirm('Remove this resource?')) return;
        router.delete(route('learning-resources.destroy', id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Learning Resources" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Learning &amp; Guidance Resources</h1>
                        <p className="mt-1 text-gray-500">
                            {canManage ? `${resources.length} resource(s)` : 'Trainings, seminars, certifications, and guidance curated for your program.'}
                        </p>
                    </div>
                    {canManage && (
                        <Link href={route('learning-resources.create')}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            + New Resource
                        </Link>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resources.map((r) => (
                        <div key={r.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[r.type] ?? 'bg-gray-100 text-gray-700'}`}>
                                    {TYPE_LABELS[r.type] ?? r.type}
                                </span>
                                {r.department && <span className="text-xs text-gray-400">{r.department.name}</span>}
                            </div>
                            <h3 className="mt-2 font-semibold text-gray-900">{r.title}</h3>
                            {r.provider && <p className="text-sm text-gray-500">{r.provider}</p>}
                            {r.description && <p className="mt-2 line-clamp-3 text-sm text-gray-600">{r.description}</p>}
                            {r.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {r.skills.map((s) => (
                                        <span key={s.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{s.name}</span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 flex items-center justify-between">
                                {r.url ? (
                                    <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                        Visit <ExternalLink size={12} />
                                    </a>
                                ) : <span />}
                                {canManage && (
                                    <div className="flex gap-3">
                                        <Link href={route('learning-resources.edit', r.id)} className="text-xs text-gray-600 hover:text-indigo-600">Edit</Link>
                                        <button onClick={() => destroy(r.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <p className="col-span-full py-12 text-center text-gray-400">No resources yet.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

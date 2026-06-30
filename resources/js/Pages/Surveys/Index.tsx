import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface Survey {
    id: number; title: string; type: string; status: string;
    opens_at: string | null; closes_at: string | null; created_at: string;
    questions_count: number; responses_count: number;
    user_response: { id: number; status: string } | null;
}
interface Props extends PageProps { surveys: Survey[]; canManage: boolean }

const typeLabels: Record<string, string> = {
    employability: 'Employability', tracer: 'Tracer', custom: 'Custom',
};
const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
};

export default function SurveysIndex({ surveys, canManage }: Props) {
    const { flash } = usePage<Props>().props;

    function destroy(id: number) {
        if (!confirm('Delete this survey?')) return;
        router.delete(route('surveys.destroy', id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Surveys" />
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
                        <p className="mt-1 text-gray-500">{surveys.length} survey(s)</p>
                    </div>
                    {canManage && (
                        <Link href={route('surveys.create')}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            + New Survey
                        </Link>
                    )}
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                <div className="space-y-3">
                    {surveys.map((survey) => (
                        <div key={survey.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-900">{survey.title}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[survey.status]}`}>
                                            {survey.status}
                                        </span>
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                            {typeLabels[survey.type] ?? survey.type}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                                        <span>{survey.questions_count} question(s)</span>
                                        {canManage && <span>{survey.responses_count} response(s)</span>}
                                        {survey.closes_at && <span>Closes {new Date(survey.closes_at).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    {canManage ? (
                                        <>
                                            <Link href={route('surveys.results', survey.id)}
                                                className="rounded-lg px-3 py-1.5 text-sm text-indigo-600 ring-1 ring-indigo-200 hover:bg-indigo-50">
                                                Results
                                            </Link>
                                            <Link href={route('surveys.edit', survey.id)}
                                                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                                                Edit
                                            </Link>
                                            <button onClick={() => destroy(survey.id)}
                                                className="rounded-lg px-3 py-1.5 text-sm text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                                                Delete
                                            </button>
                                        </>
                                    ) : survey.status === 'open' ? (
                                        survey.user_response ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                                                {survey.user_response.status === 'submitted' ? 'Submitted' : 'In Progress'}
                                            </span>
                                        ) : (
                                            <Link href={route('surveys.respond', survey.id)}
                                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                                                Respond
                                            </Link>
                                        )
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                    {surveys.length === 0 && (
                        <p className="text-center py-12 text-gray-400">No surveys yet.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

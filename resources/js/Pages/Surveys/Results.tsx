import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface AnswerSummary {
    value: string | string[] | number | null;
    count?: number;
}
interface QuestionResult {
    id: number; prompt: string; type: string; order: number;
    total_answers: number;
    answers: AnswerSummary[];
    distribution?: Record<string, number>;
}
interface Survey { id: number; title: string; type: string; status: string }
interface Props extends PageProps { survey: Survey; results: QuestionResult[]; totalResponses: number }

export default function SurveyResults({ survey, results, totalResponses }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={`Results — ${survey.title}`} />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('surveys.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Surveys</Link>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
                    <p className="mt-1 text-gray-500 text-sm">{totalResponses} submitted response(s)</p>
                </div>

                <div className="space-y-4">
                    {results.sort((a, b) => a.order - b.order).map((q) => (
                        <div key={q.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <p className="font-medium text-gray-800 mb-3">
                                {q.order}. {q.prompt}
                                <span className="ml-2 text-xs text-gray-400">({q.total_answers} answer(s))</span>
                            </p>
                            {q.distribution ? (
                                <div className="space-y-2">
                                    {Object.entries(q.distribution).map(([option, count]) => {
                                        const pct = q.total_answers > 0 ? Math.round((count / q.total_answers) * 100) : 0;
                                        return (
                                            <div key={option}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{option}</span>
                                                    <span className="text-gray-500">{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {q.answers.map((a, i) => (
                                        <div key={i} className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                            {Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '—')}
                                        </div>
                                    ))}
                                    {q.answers.length === 0 && <p className="text-sm text-gray-400">No answers yet.</p>}
                                </div>
                            )}
                        </div>
                    ))}
                    {results.length === 0 && (
                        <p className="text-center py-12 text-gray-400">No results yet.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

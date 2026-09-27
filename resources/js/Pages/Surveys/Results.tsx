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
                    <Link href={route('surveys.index')} className="text-sm text-primary hover:text-indigo-800">← Surveys</Link>
                </div>

                <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200">
                    <h1 className="text-2xl font-bold text-foreground">{survey.title}</h1>
                    <p className="mt-1 text-muted-foreground text-sm">{totalResponses} submitted response(s)</p>
                </div>

                <div className="space-y-4">
                    {/*
                        Copy before sorting: sort() mutates, and this array is
                        the Inertia page props object React reuses across
                        partial reloads.
                    */}
                    {[...results].sort((a, b) => a.order - b.order).map((q) => {
                        // PHP serialises an empty countBy() as [], which is
                        // truthy in JS — so a choice question with no answers
                        // took the chart branch, rendered nothing, and the
                        // "No answers yet." message below was unreachable for
                        // exactly the questions most likely to be empty.
                        const tally = Object.entries(q.distribution ?? {});

                        return (
                        <div key={q.id} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200">
                            <p className="font-medium text-foreground mb-3">
                                {q.order}. {q.prompt}
                                <span className="ml-2 text-xs text-muted-foreground">({q.total_answers} answer(s))</span>
                            </p>
                            {tally.length > 0 ? (
                                <div className="space-y-2">
                                    {tally.map(([option, count]) => {
                                        const pct = q.total_answers > 0 ? Math.round((count / q.total_answers) * 100) : 0;
                                        return (
                                            <div key={option}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-foreground">{option}</span>
                                                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {q.answers.map((a, i) => (
                                        <div key={i} className="rounded bg-background px-3 py-2 text-sm text-foreground">
                                            {Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '—')}
                                        </div>
                                    ))}
                                    {q.answers.length === 0 && <p className="text-sm text-muted-foreground">No answers yet.</p>}
                                </div>
                            )}
                        </div>
                        );
                    })}
                    {results.length === 0 && (
                        <p className="text-center py-12 text-muted-foreground">No results yet.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Question {
    id: number; prompt: string; type: string; options: string[] | null; is_required: boolean; order: number;
}
interface ExistingAnswer { survey_question_id: number; value: string | string[] | number | boolean | null }
interface Survey {
    id: number; title: string; description: string | null;
    questions: Question[];
}
interface Props extends PageProps { survey: Survey; existingAnswers: ExistingAnswer[] }

export default function SurveyRespond({ survey, existingAnswers }: Props) {
    const { flash } = usePage<Props>().props;

    const initialAnswers: Record<number, string | string[]> = {};
    existingAnswers.forEach((a) => {
        initialAnswers[a.survey_question_id] = Array.isArray(a.value)
            ? a.value.map(String)
            : a.value != null ? String(a.value) : '';
    });

    const [answers, setAnswers] = useState<Record<number, string | string[]>>(initialAnswers);
    const [submitting, setSubmitting] = useState(false);

    function setAnswer(qId: number, value: string | string[]) {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    }

    function toggleMulti(qId: number, option: string) {
        const current = (answers[qId] ?? []) as string[];
        setAnswer(qId, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('surveys.respond.store', survey.id), { answers }, {
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title={survey.title} />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('surveys.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Surveys</Link>
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
                    {survey.description && <p className="mt-2 text-gray-600 text-sm">{survey.description}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {survey.questions.sort((a, b) => a.order - b.order).map((q) => (
                        <div key={q.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <p className="text-sm font-medium text-gray-800 mb-3">
                                {q.order}. {q.prompt} {q.is_required && <span className="text-red-500">*</span>}
                            </p>
                            {q.type === 'text' && (
                                <input type="text" value={(answers[q.id] as string) ?? ''}
                                    onChange={(e) => setAnswer(q.id, e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            )}
                            {q.type === 'textarea' && (
                                <textarea value={(answers[q.id] as string) ?? ''}
                                    onChange={(e) => setAnswer(q.id, e.target.value)} rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            )}
                            {q.type === 'single_choice' && q.options?.map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input type="radio" name={`q-${q.id}`} value={opt}
                                        checked={(answers[q.id] as string) === opt}
                                        onChange={() => setAnswer(q.id, opt)}
                                        className="h-4 w-4 border-gray-300 text-indigo-600" />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                </label>
                            ))}
                            {q.type === 'multi_choice' && q.options?.map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input type="checkbox"
                                        checked={((answers[q.id] as string[]) ?? []).includes(opt)}
                                        onChange={() => toggleMulti(q.id, opt)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                </label>
                            ))}
                            {q.type === 'rating' && (
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map((n) => (
                                        <button key={n} type="button"
                                            onClick={() => setAnswer(q.id, String(n))}
                                            className={`h-9 w-9 rounded-full text-sm font-medium ${(answers[q.id] as string) === String(n) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {q.type === 'boolean' && (
                                <div className="flex gap-3">
                                    {['Yes', 'No'].map((opt) => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name={`q-${q.id}`} value={opt}
                                                checked={(answers[q.id] as string) === opt}
                                                onChange={() => setAnswer(q.id, opt)}
                                                className="h-4 w-4 border-gray-300 text-indigo-600" />
                                            <span className="text-sm text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {q.type === 'number' && (
                                <input type="number" value={(answers[q.id] as string) ?? ''}
                                    onChange={(e) => setAnswer(q.id, e.target.value)}
                                    className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            )}
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <button type="submit" disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Submit Response
                        </button>
                        <Link href={route('surveys.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

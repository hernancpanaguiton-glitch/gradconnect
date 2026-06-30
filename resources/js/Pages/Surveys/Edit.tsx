import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface SurveyQuestion {
    id?: number; prompt: string; type: string; options: string; is_required: boolean;
    maps_to: string; order: number;
}
interface Survey {
    id: number; title: string; description: string | null; type: string; status: string;
    target_role: string | null; target_graduation_year: number | null;
    opens_at: string | null; closes_at: string | null;
    questions: SurveyQuestion[];
}
interface Props extends PageProps { survey: Survey }

const QUESTION_TYPES = ['text','textarea','single_choice','multi_choice','rating','boolean','number'];

function toLocalDatetime(iso: string | null): string {
    if (!iso) return '';
    return iso.replace('T', 'T').slice(0, 16);
}

export default function SurveyEdit({ survey }: Props) {
    const { data, setData, patch, processing, errors } = useForm<{
        title: string; description: string; type: string; status: string;
        target_role: string; opens_at: string; closes_at: string;
        questions: SurveyQuestion[];
    }>({
        title: survey.title,
        description: survey.description ?? '',
        type: survey.type,
        status: survey.status,
        target_role: survey.target_role ?? '',
        opens_at: toLocalDatetime(survey.opens_at),
        closes_at: toLocalDatetime(survey.closes_at),
        questions: survey.questions.map((q) => ({
            id: q.id, prompt: q.prompt, type: q.type,
            options: Array.isArray(q.options) ? (q.options as string[]).join(', ') : (q.options ?? ''),
            is_required: q.is_required, maps_to: q.maps_to ?? '', order: q.order,
        })),
    });

    function addQuestion() {
        setData('questions', [...data.questions, {
            prompt: '', type: 'text', options: '', is_required: true, maps_to: '', order: data.questions.length + 1,
        }]);
    }

    function removeQuestion(i: number) {
        setData('questions', data.questions.filter((_, idx) => idx !== i));
    }

    function updateQuestion(i: number, field: keyof SurveyQuestion, value: string | boolean | number) {
        const qs = data.questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q);
        setData('questions', qs);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('surveys.update', survey.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Edit Survey" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('surveys.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Surveys</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Survey</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="employability">Employability</option>
                                    <option value="tracer">Tracer</option>
                                    <option value="custom">Custom</option>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opens At</label>
                                <input type="datetime-local" value={data.opens_at} onChange={(e) => setData('opens_at', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Closes At</label>
                                <input type="datetime-local" value={data.closes_at} onChange={(e) => setData('closes_at', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">Questions ({data.questions.length})</p>
                            <button type="button" onClick={addQuestion}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100">
                                + Add Question
                            </button>
                        </div>
                        {data.questions.map((q, i) => (
                            <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                                    <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                </div>
                                <input type="text" value={q.prompt} onChange={(e) => updateQuestion(i, 'prompt', e.target.value)}
                                    placeholder="Question prompt *"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                    </select>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={q.is_required} onChange={(e) => updateQuestion(i, 'is_required', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                                        <span className="text-sm text-gray-700">Required</span>
                                    </label>
                                </div>
                                {(q.type === 'single_choice' || q.type === 'multi_choice') && (
                                    <input type="text" value={q.options} onChange={(e) => updateQuestion(i, 'options', e.target.value)}
                                        placeholder="Options, comma-separated"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Changes
                        </button>
                        <Link href={route('surveys.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

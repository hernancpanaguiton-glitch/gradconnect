import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Question {
    prompt: string; type: string; options: string; is_required: boolean; maps_to: string;
}
interface Props extends PageProps {}

const QUESTION_TYPES = ['text','textarea','single_choice','multi_choice','rating','boolean','number'];

export default function SurveyCreate({}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string; description: string; type: string; target_role: string;
        target_graduation_year: string; opens_at: string; closes_at: string;
        questions: Question[];
    }>({
        title: '', description: '', type: 'employability', target_role: '',
        target_graduation_year: '', opens_at: '', closes_at: '', questions: [],
    });

    function addQuestion() {
        setData('questions', [...data.questions, { prompt: '', type: 'text', options: '', is_required: true, maps_to: '' }]);
    }

    function removeQuestion(i: number) {
        setData('questions', data.questions.filter((_, idx) => idx !== i));
    }

    function updateQuestion(i: number, field: keyof Question, value: string | boolean) {
        const qs = data.questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q);
        setData('questions', qs);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(route('surveys.store'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="New Survey" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('surveys.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Surveys</Link>
                    <h1 className="text-2xl font-bold text-gray-900">New Survey</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Survey metadata */}
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                                <select value={data.target_role} onChange={(e) => setData('target_role', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">All</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="student">Student</option>
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

                    {/* Questions */}
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
                                <div>
                                    <input type="text" value={q.prompt} onChange={(e) => updateQuestion(i, 'prompt', e.target.value)}
                                        placeholder="Question prompt *"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
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
                        {data.questions.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No questions yet. Click "+ Add Question" to start.</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Create Survey
                        </button>
                        <Link href={route('surveys.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

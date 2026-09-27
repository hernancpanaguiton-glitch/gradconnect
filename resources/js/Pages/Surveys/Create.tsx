import { toLocalDatetime, toUtcInstant } from '@/lib/datetime';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Question {
    uid: string; prompt: string; type: string; options: string; is_required: boolean; maps_to: string;
}
interface Props extends PageProps {}

let nextUid = 0;

/** A key that survives reordering, so React keeps each question's own input state. */
function newUid(): string {
    return `new-${nextUid++}`;
}

const QUESTION_TYPES = ['text','textarea','single_choice','multi_choice','rating','boolean','number'];
const MAPS_TO_OPTIONS = [
    { value: '', label: '(none)' },
    { value: 'employment_status', label: 'Employment status' },
    { value: 'current_employer', label: 'Current employer name' },
    { value: 'job_title', label: 'Current job title' },
    { value: 'industry', label: 'Industry' },
];

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
        setData('questions', [...data.questions, { uid: newUid(), prompt: '', type: 'text', options: '', is_required: true, maps_to: '' }]);
    }

    function removeQuestion(i: number) {
        setData('questions', data.questions.filter((_, idx) => idx !== i));
    }

    function updateQuestion(i: number, field: keyof Question, value: string | boolean) {
        const qs = data.questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q);
        setData('questions', qs);
    }

    // Per-question failures come back under dotted keys ("questions.0.options"),
    // which useForm's typed errors map doesn't model.
    const fieldErrors = errors as Record<string, string | undefined>;

    // Those keys are positions in the payload that was sent, and adding or
    // removing a row shifts every position after it. Remembering the order
    // that was actually submitted keeps each message on its own question —
    // otherwise a removal hides a real error and a new row inherits one.
    const [submittedUids, setSubmittedUids] = useState<string[]>(() => data.questions.map((question) => question.uid));

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmittedUids(data.questions.map((question) => question.uid));
        post(route('surveys.store'));
    }

    function questionError(uid: string, field: string): string | undefined {
        const index = submittedUids.indexOf(uid);

        return index === -1 ? undefined : fieldErrors[`questions.${index}.${field}`];
    }

    return (
        <AuthenticatedLayout>
            <Head title="New Survey" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('surveys.index')} className="text-sm text-primary hover:text-indigo-800">← Surveys</Link>
                    <h1 className="text-2xl font-bold text-foreground">New Survey</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Survey metadata */}
                    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="employability">Employability</option>
                                    <option value="tracer">Tracer</option>
                                    <option value="readiness">Career Readiness Assessment</option>
                                    <option value="custom">Custom</option>
                                </select>
                                {data.type === 'readiness' && (
                                    <p className="mt-1 text-xs text-muted-foreground">Only "rating" questions (1–5) count toward the readiness score.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Target Role</label>
                                <select value={data.target_role} onChange={(e) => setData('target_role', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="">All</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Target Graduation Year</label>
                                <input type="number" value={data.target_graduation_year} onChange={(e) => setData('target_graduation_year', e.target.value)}
                                    placeholder="Leave blank for all years"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Opens At</label>
                                <input type="datetime-local" value={toLocalDatetime(data.opens_at)} onChange={(e) => setData('opens_at', toUtcInstant(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Closes At</label>
                                <input type="datetime-local" value={toLocalDatetime(data.closes_at)} onChange={(e) => setData('closes_at', toUtcInstant(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">Questions ({data.questions.length})</p>
                            <button type="button" onClick={addQuestion}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100">
                                + Add Question
                            </button>
                        </div>
                        {data.questions.map((q, i) => (
                            <div key={q.uid} className="rounded-lg border border-gray-200 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                                    <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-destructive hover:text-destructive">Remove</button>
                                </div>
                                <div>
                                    <input type="text" value={q.prompt} onChange={(e) => updateQuestion(i, 'prompt', e.target.value)}
                                        placeholder="Question prompt *"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                    {questionError(q.uid, 'prompt') && (
                                        <p className="mt-1 text-xs text-destructive">{questionError(q.uid, 'prompt')}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                    </select>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={q.is_required} onChange={(e) => updateQuestion(i, 'is_required', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary" />
                                        <span className="text-sm text-foreground">Required</span>
                                    </label>
                                </div>
                                {questionError(q.uid, 'type') && (
                                    <p className="text-xs text-destructive">{questionError(q.uid, 'type')}</p>
                                )}
                                {(q.type === 'single_choice' || q.type === 'multi_choice') && (
                                    <div>
                                        <input type="text" value={q.options} onChange={(e) => updateQuestion(i, 'options', e.target.value)}
                                            placeholder="Options, comma-separated"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                        {questionError(q.uid, 'options') && (
                                            <p className="mt-1 text-xs text-destructive">{questionError(q.uid, 'options')}</p>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1 block text-xs text-muted-foreground">Feed this answer into (optional)</label>
                                    <select value={q.maps_to} onChange={(e) => updateQuestion(i, 'maps_to', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        {MAPS_TO_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))}
                        {data.questions.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No questions yet. Click "+ Add Question" to start.</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Create Survey
                        </button>
                        <Link href={route('surveys.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-muted-foreground ring-1 ring-gray-300 hover:bg-background">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

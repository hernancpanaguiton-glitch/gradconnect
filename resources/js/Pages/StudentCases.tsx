import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { LifeBuoy } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface CaseItem {
    id: number; category: string; description: string; status: string;
    resolution_notes: string | null; created_at: string;
    graduate_profile?: { user: { name: string } };
    reported_by?: { name: string };
    assigned_to?: { name: string } | null;
}
interface Props extends PageProps { cases: CaseItem[]; canManage: boolean }

const CATEGORY_LABELS: Record<string, string> = {
    academic: 'Academic', financial: 'Financial', personal: 'Personal',
    disciplinary: 'Disciplinary', other: 'Other',
};
const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    closed: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

function FileConcernForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({ category: 'academic', description: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(route('student-cases.store'), { onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <select value={data.category} onChange={(e) => setData('category', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <textarea placeholder="Describe your concern *" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">Submit</button>
            </div>
        </form>
    );
}

export default function StudentCases({ cases, canManage }: Props) {
    const [showForm, setShowForm] = useState(false);

    function updateStatus(id: number, status: string) {
        router.patch(route('student-cases.update', id), { status }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Student Concerns" />
            <div className="space-y-6">
                <PageHeader
                    icon={LifeBuoy}
                    title={canManage ? 'Student Concerns & Cases' : 'My Concerns'}
                    subtitle={canManage ? 'Concerns reported by students and alumni, for follow-up and resolution.' : 'File a concern with the Student Affairs Office.'}
                    action={!canManage ? (
                        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            {showForm ? 'Cancel' : 'File a Concern'}
                        </button>
                    ) : undefined}
                />

                {showForm && <FileConcernForm onDone={() => setShowForm(false)} />}

                <div className="space-y-3">
                    {cases.map((c) => (
                        <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                                        {canManage && c.graduate_profile && <span className="text-sm font-semibold text-foreground">{c.graduate_profile.user.name}</span>}
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                                    {c.resolution_notes && <p className="mt-2 text-xs text-muted-foreground"><strong>Resolution:</strong> {c.resolution_notes}</p>}
                                    {c.assigned_to && <p className="mt-1 text-xs text-muted-foreground">Assigned to {c.assigned_to.name}</p>}
                                </div>
                                {canManage ? (
                                    <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}
                                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                                        {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                    </select>
                                ) : (
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status.replace('_', ' ')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {cases.length === 0 && <p className="py-12 text-center text-muted-foreground">No concerns {canManage ? 'reported yet' : 'filed yet'}.</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

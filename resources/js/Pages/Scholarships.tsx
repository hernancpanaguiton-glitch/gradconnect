import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Award, GraduationCap, Wallet } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Recipient { id: number; graduate_profile: { user: { name: string } } }
interface ScholarshipItem {
    id: number; name: string; provider: string | null; description: string | null;
    budget_amount: string | null; status: string; recipients_count: number; recipients: Recipient[];
}
interface Graduate { id: number; name: string; student_number: string | null }
interface Props extends PageProps {
    scholarships: ScholarshipItem[]; totalBudget: number; totalRecipients: number; graduates: Graduate[];
}

const STATUS: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    closed: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};
/** A status this page hasn't learned yet still has to render as a badge. */
const STATUS_FALLBACK = 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300';

function CreateForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', provider: '', description: '', budget_amount: '', status: 'active',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(route('scholarships.store'), { onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <input type="text" placeholder="Program name *" value={data.name} onChange={(e) => setData('name', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            <div className="form-grid-tight">
                <input type="text" placeholder="Provider" value={data.provider} onChange={(e) => setData('provider', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" placeholder="Budget (₱)" value={data.budget_amount} onChange={(e) => setData('budget_amount', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <textarea placeholder="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">Add Program</button>
            </div>
        </form>
    );
}

function RecipientPanel({ scholarship, graduates }: { scholarship: ScholarshipItem; graduates: Graduate[] }) {
    const [graduateId, setGraduateId] = useState('');

    function addRecipient() {
        if (!graduateId) return;
        router.post(route('scholarships.recipients.store', scholarship.id), { graduate_profile_id: graduateId }, { preserveScroll: true });
        setGraduateId('');
    }

    function removeRecipient(recipientId: number) {
        router.delete(route('scholarships.recipients.destroy', recipientId), { preserveScroll: true });
    }

    return (
        <div className="mt-3 border-t border-border pt-3">
            <div className="flex flex-wrap gap-1.5">
                {scholarship.recipients.map((r) => (
                    <span key={r.id} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                        {r.graduate_profile.user.name}
                        <button onClick={() => removeRecipient(r.id)} className="text-red-500 hover:text-red-700">×</button>
                    </span>
                ))}
                {scholarship.recipients.length === 0 && <span className="text-xs text-muted-foreground">No recipients yet.</span>}
            </div>
            <div className="mt-2 flex gap-2">
                <select value={graduateId} onChange={(e) => setGraduateId(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Add recipient…</option>
                    {graduates.map((g) => <option key={g.id} value={g.id}>{g.name}{g.student_number ? ` (${g.student_number})` : ''}</option>)}
                </select>
                <button onClick={addRecipient} className="rounded-lg bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/70">Add</button>
            </div>
        </div>
    );
}

export default function Scholarships({ scholarships, totalBudget, totalRecipients, graduates }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    function destroy(id: number) {
        if (!confirm('Delete this scholarship program?')) return;
        router.delete(route('scholarships.destroy', id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Scholarships" />
            <div className="space-y-6">
                <PageHeader icon={GraduationCap} title="Scholarships" subtitle="Scholarship programs, recipients, and budgets."
                    action={<button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                        {showForm ? 'Cancel' : 'Add Program'}
                    </button>} />

                {showForm && <CreateForm onDone={() => setShowForm(false)} />}

                <div className="grid gap-5 sm:grid-cols-3">
                    <StatTile icon={Award} color="amber" label="Scholarship Recipients" value={totalRecipients} />
                    <StatTile icon={GraduationCap} color="blue" label="Active Programs" value={scholarships.filter((s) => s.status === 'active').length} />
                    <StatTile icon={Wallet} color="green" label="Total Budget" value={`₱${totalBudget.toLocaleString()}`} />
                </div>

                <div className="space-y-3">
                    {scholarships.map((s) => (
                        <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                                    {s.provider && <p className="text-sm text-muted-foreground">{s.provider}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[s.status] ?? STATUS_FALLBACK}`}>{s.status}</span>
                                    <button onClick={() => destroy(s.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                </div>
                            </div>
                            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                                <span>{s.recipients_count} recipient(s)</span>
                                {s.budget_amount && <span>Budget: ₱{Number(s.budget_amount).toLocaleString()}</span>}
                            </div>
                            <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="mt-2 text-xs font-medium text-primary hover:underline">
                                {expanded === s.id ? 'Hide recipients' : 'Manage recipients'}
                            </button>
                            {expanded === s.id && <RecipientPanel scholarship={s} graduates={graduates} />}
                        </div>
                    ))}
                    {scholarships.length === 0 && <p className="py-12 text-center text-muted-foreground">No scholarship programs yet.</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

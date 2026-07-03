import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';

const PROGRESS = [
    { label: 'Students with Complete Clearance', value: 3890, total: 4210, color: 'bg-emerald-500' },
    { label: 'Students with Active Scholarships', value: 734, total: 4210, color: 'bg-primary' },
    { label: 'Pending Library Clearance', value: 190, total: 4210, color: 'bg-amber-500' },
    { label: 'Pending Accounts Settlement', value: 130, total: 4210, color: 'bg-red-500' },
];
const STEPS = [
    { label: 'Library', done: true }, { label: 'Accounting / Cashier', done: true },
    { label: 'Registrar', done: true }, { label: 'Department', done: false },
    { label: 'Student Affairs', done: false }, { label: 'Alumni Office', done: false },
];

export default function Clearance() {
    return (
        <AuthenticatedLayout>
            <Head title="Clearance & Records" />
            <div className="space-y-6">
                <PageHeader icon={ListChecks} title="Clearance & Records" subtitle="Graduation clearance progress across offices." />

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Institution-wide progress</h2>
                        <div className="space-y-4">
                            {PROGRESS.map((p) => (
                                <div key={p.label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-foreground">{p.label}</span>
                                        <span className="text-muted-foreground">{p.value.toLocaleString()} / {p.total.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${p.color}`} style={{ width: `${(p.value / p.total) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Sample student checklist</h2>
                        <ul className="space-y-3">
                            {STEPS.map((s) => (
                                <li key={s.label} className="flex items-center gap-3 text-sm">
                                    {s.done
                                        ? <CheckCircle2 size={18} className="text-emerald-500" />
                                        : <Circle size={18} className="text-muted-foreground" />}
                                    <span className={s.done ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                                    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${s.done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                        {s.done ? 'Cleared' : 'Pending'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

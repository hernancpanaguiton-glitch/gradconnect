import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';

interface OfficeProgress { office: string; cleared: number; total: number }
interface ChecklistItem { office: string; status: string; cleared_at: string | null }
interface Graduate { id: number; name: string; student_number: string | null }

interface ManagerProps extends PageProps {
    mode: 'manager';
    officeProgress: OfficeProgress[];
    totalGraduates: number;
    graduates: Graduate[];
    selectedProfileId: number | null;
    selectedChecklist: ChecklistItem[] | null;
}
interface OwnProps extends PageProps {
    mode: 'own';
    checklist: ChecklistItem[];
}
type Props = ManagerProps | OwnProps;

const OFFICE_LABELS: Record<string, string> = {
    library: 'Library', accounting: 'Accounting / Cashier', registrar: 'Registrar',
    department: 'Department', student_affairs: 'Student Affairs', alumni_office: 'Alumni Office',
};

function Checklist({ items, onToggle }: { items: ChecklistItem[]; onToggle?: (office: string, status: string) => void }) {
    return (
        <ul className="space-y-3">
            {items.map((item) => {
                const cleared = item.status === 'cleared';
                return (
                    <li key={item.office} className="flex items-center gap-3 text-sm">
                        {cleared ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-muted-foreground" />}
                        <span className={cleared ? 'text-foreground' : 'text-muted-foreground'}>{OFFICE_LABELS[item.office] ?? item.office}</span>
                        {onToggle ? (
                            <button onClick={() => onToggle(item.office, cleared ? 'pending' : 'cleared')}
                                className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${cleared ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                                {cleared ? 'Cleared' : 'Mark Cleared'}
                            </button>
                        ) : (
                            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${cleared ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                {cleared ? 'Cleared' : 'Pending'}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function Clearance(props: Props) {
    if (props.mode === 'own') {
        return (
            <AuthenticatedLayout>
                <Head title="Clearance & Records" />
                <div className="space-y-6">
                    <PageHeader icon={ListChecks} title="My Clearance" subtitle="Your graduation clearance progress across offices." />
                    <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
                        <Checklist items={props.checklist} />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const { officeProgress, totalGraduates, graduates, selectedProfileId, selectedChecklist } = props;

    function selectGraduate(id: string) {
        router.get(route('clearance'), id ? { graduate_profile_id: id } : {}, { preserveState: true });
    }

    function toggle(office: string, status: string) {
        if (!selectedProfileId) return;
        router.patch(route('clearance.update', selectedProfileId), { office, status }, { preserveScroll: true, preserveState: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Clearance & Records" />
            <div className="space-y-6">
                <PageHeader icon={ListChecks} title="Clearance & Records" subtitle="Graduation clearance progress across offices." />

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Institution-wide progress</h2>
                        <div className="space-y-4">
                            {officeProgress.map((p) => (
                                <div key={p.office}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-foreground">{OFFICE_LABELS[p.office] ?? p.office}</span>
                                        <span className="text-muted-foreground">{p.cleared.toLocaleString()} / {p.total.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalGraduates ? (p.cleared / totalGraduates) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Student checklist</h2>
                        <select onChange={(e) => selectGraduate(e.target.value)} defaultValue={selectedProfileId ?? ''}
                            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="">Select a student…</option>
                            {graduates.map((g) => <option key={g.id} value={g.id}>{g.name}{g.student_number ? ` (${g.student_number})` : ''}</option>)}
                        </select>
                        {selectedChecklist ? (
                            <Checklist items={selectedChecklist} onToggle={toggle} />
                        ) : (
                            <p className="text-sm text-muted-foreground">Select a student to view or update their clearance.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

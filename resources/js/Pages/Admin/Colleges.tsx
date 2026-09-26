import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, School, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface DepartmentRow {
    id: number;
    name: string;
    code: string;
    type: 'college' | 'program';
    parent_id: number | null;
    users_count: number;
    graduate_profiles_count: number;
    learning_resources_count: number;
    children_count: number;
}

interface CollegeRow extends DepartmentRow {
    children: DepartmentRow[];
}

interface Props extends PageProps {
    colleges: CollegeRow[];
    orphanPrograms: DepartmentRow[];
}

/** The usage counts that also block a delete, as a readable summary. */
function usage(row: DepartmentRow): string {
    const parts: string[] = [];

    if (row.children_count) parts.push(`${row.children_count} program${row.children_count === 1 ? '' : 's'}`);
    if (row.users_count) parts.push(`${row.users_count} user${row.users_count === 1 ? '' : 's'}`);
    if (row.graduate_profiles_count) parts.push(`${row.graduate_profiles_count} graduate${row.graduate_profiles_count === 1 ? '' : 's'}`);
    if (row.learning_resources_count) parts.push(`${row.learning_resources_count} resource${row.learning_resources_count === 1 ? '' : 's'}`);

    return parts.length ? parts.join(' · ') : 'Not in use';
}

/** Inline rename/recode, and for a program the college it belongs to. */
function EditRow({ row, colleges, onDelete }: { row: DepartmentRow; colleges: CollegeRow[]; onDelete: () => void }) {
    const { data, setData, patch, processing, errors, isDirty } = useForm({
        name: row.name,
        code: row.code,
        type: row.type,
        parent_id: row.parent_id ? String(row.parent_id) : '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        patch(route('admin.departments.update', row.id), { preserveScroll: true });
    }

    const inputClass = 'min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none';

    return (
        <form onSubmit={submit} className="flex flex-col gap-2 border-b border-border px-3 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-2 sm:px-4">
            <input
                value={data.code}
                onChange={(e) => setData('code', e.target.value)}
                aria-label="Code"
                className={`${inputClass} font-mono uppercase sm:w-28`}
            />
            <input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                aria-label="Name"
                className={`${inputClass} flex-1`}
            />

            {row.type === 'program' && (
                <select
                    value={data.parent_id}
                    onChange={(e) => setData('parent_id', e.target.value)}
                    aria-label="College"
                    className={`${inputClass} sm:w-48`}
                >
                    {colleges.map((college) => (
                        <option key={college.id} value={college.id}>{college.code}</option>
                    ))}
                </select>
            )}

            <span className="text-xs text-muted-foreground sm:w-44 sm:shrink-0 sm:text-right">{usage(row)}</span>

            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="submit"
                    disabled={processing || !isDirty}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50 disabled:opacity-40 dark:hover:bg-blue-500/10"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete ${row.name}`}
                    className="tap-target rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {(errors.name || errors.code || errors.parent_id) && (
                <p className="text-xs text-red-600 sm:w-full">{errors.name ?? errors.code ?? errors.parent_id}</p>
            )}
        </form>
    );
}

/** Add a program under one college. */
function AddProgram({ collegeId }: { collegeId: number }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        type: 'program',
        parent_id: String(collegeId),
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(route('admin.departments.store'), { preserveScroll: true, onSuccess: () => reset('name', 'code') });
    }

    const inputClass = 'min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none';

    return (
        <form onSubmit={submit} className="flex flex-col gap-2 bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
            <input
                value={data.code}
                onChange={(e) => setData('code', e.target.value)}
                placeholder="BSIT"
                aria-label="New program code"
                className={`${inputClass} font-mono uppercase sm:w-28`}
            />
            <input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="BS Information Technology"
                aria-label="New program name"
                className={`${inputClass} flex-1`}
            />
            <button
                type="submit"
                disabled={processing || !data.name || !data.code}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70 disabled:opacity-40"
            >
                <Plus size={14} /> Add program
            </button>

            {(errors.name || errors.code) && (
                <p className="text-xs text-red-600 sm:w-full">{errors.name ?? errors.code}</p>
            )}
        </form>
    );
}

export default function Colleges({ colleges, orphanPrograms }: Props) {
    const [confirming, setConfirming] = useState<DepartmentRow | null>(null);

    const addCollege = useForm({ name: '', code: '', type: 'college', parent_id: '' });
    const remove = useForm({});

    // A refused delete reports against `department`, which belongs to no form.
    const blockedDelete = usePage().props.errors?.department;

    function submitCollege(e: FormEvent) {
        e.preventDefault();
        addCollege.post(route('admin.departments.store'), {
            preserveScroll: true,
            onSuccess: () => addCollege.reset('name', 'code'),
        });
    }

    function confirmDelete() {
        if (!confirming) {
            return;
        }

        remove.delete(route('admin.departments.destroy', confirming.id), {
            preserveScroll: true,
            onFinish: () => setConfirming(null),
        });
    }

    const inputClass = 'min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none';

    return (
        <AuthenticatedLayout>
            <Head title="Colleges & Programs" />
            <div className="space-y-6">
                <PageHeader
                    icon={School}
                    title="Colleges & Programs"
                    subtitle="The institution's structure. Graduate profiles, learning resources and every department-scoped report read from these rows."
                />

                {/* A blocked delete reports here rather than on a row. */}
                {blockedDelete && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {blockedDelete}
                    </div>
                )}

                <form onSubmit={submitCollege} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-start">
                    <div className="sm:w-32">
                        <input
                            value={addCollege.data.code}
                            onChange={(e) => addCollege.setData('code', e.target.value)}
                            placeholder="CCS"
                            aria-label="New college code"
                            className={`${inputClass} w-full font-mono uppercase`}
                        />
                        {addCollege.errors.code && <p className="mt-1 text-xs text-red-600">{addCollege.errors.code}</p>}
                    </div>
                    <div className="flex-1">
                        <input
                            value={addCollege.data.name}
                            onChange={(e) => addCollege.setData('name', e.target.value)}
                            placeholder="College of Computer Studies"
                            aria-label="New college name"
                            className={`${inputClass} w-full`}
                        />
                        {addCollege.errors.name && <p className="mt-1 text-xs text-red-600">{addCollege.errors.name}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={addCollege.processing || !addCollege.data.name || !addCollege.data.code}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-40"
                    >
                        <Plus size={15} /> Add college
                    </button>
                </form>

                {colleges.map((college) => (
                    <div key={college.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border bg-muted/40 px-3 py-3 sm:px-4">
                            <EditRow row={college} colleges={colleges} onDelete={() => setConfirming(college)} />
                        </div>

                        {college.children.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-muted-foreground">No programs yet.</p>
                        ) : (
                            college.children.map((program) => (
                                <EditRow key={program.id} row={program} colleges={colleges} onDelete={() => setConfirming(program)} />
                            ))
                        )}

                        <AddProgram collegeId={college.id} />
                    </div>
                ))}

                {orphanPrograms.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-amber-300 bg-card shadow-sm dark:border-amber-500/40">
                        <p className="border-b border-border bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                            Programs with no college — assign each one below.
                        </p>
                        {orphanPrograms.map((program) => (
                            <EditRow key={program.id} row={program} colleges={colleges} onDelete={() => setConfirming(program)} />
                        ))}
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    Codes link a row to the seeded UCLM catalogue, so renaming is safe but recoding is not — change a code only for a
                    department you added yourself.
                </p>
            </div>

            {confirming && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <h2 className="text-base font-semibold text-foreground">Delete {confirming.name}?</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {usage(confirming) === 'Not in use'
                                ? 'This cannot be undone.'
                                : `This ${confirming.type} is still in use (${usage(confirming)}), so the delete will be refused until those are moved.`}
                        </p>
                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirming(null)}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={remove.processing}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

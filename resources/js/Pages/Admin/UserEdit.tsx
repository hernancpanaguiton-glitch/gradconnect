import { roleLabel } from '@/lib/roles';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Role { id: number; name: string }
interface College { id: number; name: string; code: string | null }
interface UserDetail {
    id: number; name: string; first_name: string; last_name: string;
    email: string; id_number: string | null; status: string;
    department_id: number | null;
    roles: Role[];
}
interface Props extends PageProps { user: UserDetail; roles: Role[]; colleges: College[] }

export default function UserEdit({ user, roles, colleges }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        status: user.status,
        roles: user.roles.map((r) => r.name),
        department_id: user.department_id ? String(user.department_id) : '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('admin.users.update', user.id));
    }

    function toggleRole(name: string) {
        // Derive from the pending value, not this render's snapshot: two
        // boxes ticked before the next commit would otherwise both start
        // from the same list and the second would drop the first.
        setData((current) => ({
            ...current,
            roles: current.roles.includes(name)
                ? current.roles.filter((role) => role !== name)
                : [...current.roles, name],
        }));
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${user.name}`} />

            <div className="max-w-xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.index')} className="text-sm text-primary hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
                </div>

                <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="mb-5 space-y-0.5">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.id_number && <p className="text-sm text-muted-foreground">ID: {user.id_number}</p>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Account Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
                        </div>

                        {/* Roles */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Roles</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map((role) => (
                                    <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.roles.includes(role.name)}
                                            onChange={() => toggleRole(role.name)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-foreground">{roleLabel(role.name)}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.roles && <p className="mt-1 text-xs text-destructive">{errors.roles}</p>}
                        </div>

                        {/* College / Department */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                College / Department <span className="font-normal text-muted-foreground">(for Deans &amp; Dept. Heads)</span>
                            </label>
                            <select
                                value={data.department_id}
                                onChange={(e) => setData('department_id', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">— None —</option>
                                {colleges.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.department_id && <p className="mt-1 text-xs text-destructive">{errors.department_id}</p>}
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                Save Changes
                            </button>
                            <Link href={route('admin.users.index')} className="rounded-lg px-5 py-2 text-sm font-medium text-muted-foreground ring-1 ring-gray-300 hover:bg-background">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

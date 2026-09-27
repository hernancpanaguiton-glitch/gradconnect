import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Props extends PageProps {
    roles: Role[];
    permissionGroups: Record<string, Permission[]>;
    /** Roles the backend refuses to delete — sent by the server so this page can't drift from it. */
    protectedRoles: string[];
    /** The super-role whose permission set the backend refuses to edit. */
    lockedRole: string;
}

export default function Roles({ roles, permissionGroups, protectedRoles, lockedRole }: Props) {
    const { flash } = usePage<Props>().props;

    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

    const [saving, setSaving] = useState<number | null>(null);

    function hasPermission(role: Role, permName: string): boolean {
        return role.permissions.some((p) => p.name === permName);
    }

    function togglePermission(role: Role, permName: string) {
        const current = role.permissions.map((p) => p.name);
        const updated = current.includes(permName)
            ? current.filter((p) => p !== permName)
            : [...current, permName];

        setSaving(role.id);
        router.patch(
            route('admin.roles.permissions.update', role.id),
            { permissions: updated },
            {
                preserveScroll: true,
                onFinish: () => setSaving(null),
            },
        );
    }

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        post(route('admin.roles.store'), { onSuccess: () => reset() });
    }

    function deleteRole(role: Role) {
        if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        router.delete(route('admin.roles.destroy', role.id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Roles & Permissions" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
                        <p className="mt-1 text-muted-foreground">Manage role definitions and permission assignments.</p>
                    </div>
                </div>


                {/* Create role */}
                <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-base font-semibold text-foreground mb-3">Create New Role</h2>
                    <form onSubmit={handleCreate} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="role_name (snake_case)"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Create Role
                        </button>
                    </form>
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>

                {/* Permissions matrix */}
                <div className="rounded-xl bg-card shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200">
                        <h2 className="text-base font-semibold text-foreground">Permission Matrix</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Click a cell to toggle a permission for that role.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-56">Permission</th>
                                    {roles.map((role) => (
                                        <th key={role.id} className="px-3 py-3 text-center font-medium text-muted-foreground min-w-[120px]">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="capitalize">{role.name.replace(/_/g, ' ')}</span>
                                                {role.name === lockedRole && (
                                                    <span className="text-[10px] font-normal text-muted-foreground">always full access</span>
                                                )}
                                                {!protectedRoles.includes(role.name) && (
                                                    <button
                                                        onClick={() => deleteRole(role)}
                                                        className="text-xs text-red-400 hover:text-destructive"
                                                    >
                                                        delete
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(permissionGroups).map(([group, perms]) => (
                                    <>
                                        <tr key={`group-${group}`} className="bg-background">
                                            <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {group}
                                            </td>
                                        </tr>
                                        {perms.map((perm) => (
                                            <tr key={perm.id} className="hover:bg-background">
                                                <td className="px-4 py-2 text-foreground font-mono text-xs">{perm.name}</td>
                                                {roles.map((role) => {
                                                    const active = hasPermission(role, perm.name);
                                                    // The admin role is seeded with everything and the
                                                    // backend refuses to change it.
                                                    const locked = role.name === lockedRole;
                                                    const isSaving = saving === role.id;
                                                    return (
                                                        <td key={role.id} className="px-3 py-2 text-center">
                                                            <button
                                                                onClick={() => togglePermission(role, perm.name)}
                                                                disabled={isSaving || locked}
                                                                className={`h-6 w-6 rounded transition-colors ${
                                                                    active
                                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                        : 'bg-muted hover:bg-secondary'
                                                                } ${isSaving || locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title={locked
                                                                    ? `The ${role.name} role always holds every permission`
                                                                    : `${active ? 'Remove' : 'Grant'} ${perm.name} from ${role.name}`}
                                                            >
                                                                {active && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 mx-auto">
                                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

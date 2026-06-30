import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Role { id: number; name: string }
interface UserDetail {
    id: number; name: string; first_name: string; last_name: string;
    email: string; id_number: string | null; status: string;
    roles: Role[];
}
interface Props extends PageProps { user: UserDetail; roles: Role[] }

export default function UserEdit({ user, roles }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        status: user.status,
        roles: user.roles.map((r) => r.name),
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('admin.users.update', user.id));
    }

    function toggleRole(name: string) {
        setData('roles', data.roles.includes(name)
            ? data.roles.filter((r) => r !== name)
            : [...data.roles, name]);
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${user.name}`} />

            <div className="max-w-xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="mb-5 space-y-0.5">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.id_number && <p className="text-sm text-gray-500">ID: {user.id_number}</p>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
                        </div>

                        {/* Roles */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map((role) => (
                                    <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.roles.includes(role.name)}
                                            onChange={() => toggleRole(role.name)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{role.name.replace(/_/g, ' ')}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.roles && <p className="mt-1 text-xs text-red-600">{errors.roles}</p>}
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                Save Changes
                            </button>
                            <Link href={route('admin.users.index')} className="rounded-lg px-5 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import TableCard from '@/Components/TableCard';
import Pagination from '@/Components/Pagination';
import { roleLabel } from '@/lib/roles';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface UserRow {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    id_number: string | null;
    status: string;
    roles: Array<{ id: number; name: string }>;
}

interface PaginatedUsers {
    data: UserRow[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props extends PageProps {
    users: PaginatedUsers;
    filters: { search?: string };
}

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
};

export default function Users({ users, filters }: Props) {
    const { flash } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true, replace: true });
    }

    function deleteUser(id: number, name: string) {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        router.delete(route('admin.users.destroy', id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                        <p className="mt-1 text-muted-foreground">{users.total} users total</p>
                    </div>
                    <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, ID…"
                            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64 sm:flex-none"
                        />
                        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Search
                        </button>
                    </form>
                </div>


                <TableCard wide>
                    <table className="min-w-full text-sm">
                        <thead className="bg-background border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID Number</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roles</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-background">
                                    <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.id_number ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[user.status] ?? 'bg-muted text-muted-foreground'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((r) => (
                                                <span key={r.id} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                                                    {roleLabel(r.name)}
                                                </span>
                                            ))}
                                            {user.roles.length === 0 && <span className="text-muted-foreground text-xs">none</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('admin.users.edit', user.id)}
                                                className="text-xs text-primary hover:text-indigo-800 font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => deleteUser(user.id, user.name)}
                                                className="text-xs text-destructive hover:text-destructive font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </TableCard>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {users.from}–{users.to} of {users.total}
                        </p>
                        <Pagination links={users.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

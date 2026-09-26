import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Briefcase, CheckCheck, CircleCheck, Clock, UserCheck } from 'lucide-react';

interface Item {
    id: string;
    type: string;
    title: string;
    message: string;
    url: string | null;
    read: boolean;
    time: string;
}
interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}
interface Props {
    notifications: Paginated<Item>;
    unreadCount: number;
}

const ICONS: Record<string, { icon: typeof Briefcase; color: string }> = {
    application_received: { icon: Briefcase, color: 'text-primary bg-blue-50 dark:bg-blue-500/15' },
    application_status: { icon: CircleCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' },
    account_approved: { icon: UserCheck, color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/15' },
    account_pending: { icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15' },
    general: { icon: Bell, color: 'text-muted-foreground bg-muted' },
};

export default function Notifications({ notifications, unreadCount }: Props) {
    function markRead(id: string) {
        router.patch(route('notifications.read', id), {}, { preserveScroll: true });
    }
    function markAll() {
        router.patch(route('notifications.read-all'), {}, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />
            <div className="space-y-6">
                <PageHeader
                    icon={Bell}
                    title="Notifications"
                    subtitle="Job applications, status updates, and account alerts."
                    action={unreadCount > 0 ? (
                        <button onClick={markAll} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                            <CheckCheck size={16} /> Mark all as read
                        </button>
                    ) : undefined}
                />

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {notifications.data.length === 0 && (
                        <p className="p-12 text-center text-muted-foreground">You have no notifications yet.</p>
                    )}
                    {notifications.data.map((n) => {
                        const meta = ICONS[n.type] ?? ICONS.general;
                        const Icon = meta.icon;
                        const body = (
                            <>
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}><Icon size={18} /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                                    <p className="text-sm text-muted-foreground">{n.message}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{n.time}</p>
                                </div>
                                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </>
                        );
                        return (
                            <div key={n.id} className={`flex items-start gap-3 border-b border-border px-5 py-4 last:border-0 ${!n.read ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''}`}>
                                {n.url ? (
                                    <Link href={n.url} onClick={() => !n.read && markRead(n.id)} className="flex flex-1 items-start gap-3">{body}</Link>
                                ) : (
                                    <div className="flex flex-1 items-start gap-3">{body}</div>
                                )}
                                {!n.read && (
                                    <button onClick={() => markRead(n.id)} className="shrink-0 text-xs font-medium text-primary hover:underline">Mark read</button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <Pagination links={notifications.links} className="justify-center" />
            </div>
        </AuthenticatedLayout>
    );
}

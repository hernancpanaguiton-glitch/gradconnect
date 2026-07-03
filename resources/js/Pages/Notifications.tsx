import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Bell, Briefcase, Calendar, FileText, MessageSquare } from 'lucide-react';

const NOTIFS = [
    { icon: Briefcase, color: 'text-primary bg-blue-50 dark:bg-blue-500/15', title: 'New job match: Senior Full Stack Developer', time: '2 minutes ago', unread: true },
    { icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15', title: 'Cebu Pacific IT sent you a message', time: '1 hour ago', unread: true },
    { icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15', title: 'Your résumé analysis is ready', time: '3 hours ago', unread: false },
    { icon: Calendar, color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/15', title: 'Reminder: UCLM Career Fair 2026', time: 'Yesterday', unread: false },
    { icon: FileText, color: 'text-primary bg-blue-50 dark:bg-blue-500/15', title: 'Tracer Survey 2026 is now open', time: '2 days ago', unread: false },
];

export default function Notifications() {
    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />
            <div className="space-y-6">
                <PageHeader
                    icon={Bell}
                    title="Notifications"
                    subtitle="Job matches, messages, and reminders."
                    action={<button className="text-sm font-semibold text-primary hover:underline">Mark all as read</button>}
                />
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {NOTIFS.map((n, i) => (
                        <div key={i} className={`flex items-start gap-3 border-b border-border px-5 py-4 last:border-0 ${n.unread ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''}`}>
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.color}`}><n.icon size={18} /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.time}</p>
                            </div>
                            {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

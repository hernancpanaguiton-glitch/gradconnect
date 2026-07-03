import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Bell, Send } from 'lucide-react';
import { useState } from 'react';

const THREADS = [
    { id: 1, name: 'Cebu Pacific IT', last: 'We’d love to schedule an interview…', time: '2m', unread: 2, avatar: 'CP' },
    { id: 2, name: 'Alumni Affairs Office', last: 'Reminder: Tracer Survey 2026 is open', time: '1h', unread: 0, avatar: 'AA' },
    { id: 3, name: 'Accenture Recruiting', last: 'Thanks for applying to the role.', time: '3h', unread: 0, avatar: 'AC' },
    { id: 4, name: 'Maria Santos', last: 'Sure — happy to be a mentor!', time: '1d', unread: 0, avatar: 'MS' },
];
const MESSAGES = [
    { from: 'them', text: 'Hi! We reviewed your application and were impressed.' },
    { from: 'me', text: 'Thank you! I’m very interested in the role.' },
    { from: 'them', text: 'Great — are you available for an interview this week?' },
];

export default function Messages() {
    const [active, setActive] = useState(THREADS[0]);

    return (
        <AuthenticatedLayout>
            <Head title="Messages" />
            <div className="space-y-6">
                <PageHeader icon={Bell} title="Messages" subtitle="Conversations with employers, offices, and mentors." />

                <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-3">
                    <div className="border-border lg:col-span-1 lg:border-r">
                        {THREADS.map((t) => (
                            <button key={t.id} onClick={() => setActive(t)}
                                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted ${active.id === t.id ? 'bg-muted' : ''}`}>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">{t.avatar}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                                        <span className="text-xs text-muted-foreground">{t.time}</span>
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">{t.last}</p>
                                </div>
                                {t.unread > 0 && <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{t.unread}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex min-h-[26rem] flex-col lg:col-span-2">
                        <div className="border-b border-border px-5 py-3">
                            <p className="font-semibold text-foreground">{active.name}</p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto p-5">
                            {MESSAGES.map((m, i) => (
                                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.from === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 border-t border-border p-3">
                            <input placeholder="Type a message…" className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:bg-card focus:outline-none" />
                            <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700"><Send size={15} /> Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

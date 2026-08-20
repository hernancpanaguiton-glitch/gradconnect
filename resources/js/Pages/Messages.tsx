import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Send } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ConversationItem {
    id: number; other: { id: number; name: string } | null;
    last_message: string | null; last_message_at: string | null; unread: boolean;
}
interface MessageItem { id: number; body: string; mine: boolean; created_at: string }
interface ActiveConversation { id: number; other: { id: number; name: string } | null; messages: MessageItem[] }
interface MessageableUser { id: number; name: string; role: string }
interface Props extends PageProps {
    conversations: ConversationItem[];
    messageableUsers: MessageableUser[];
    active: ActiveConversation | null;
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Messages({ conversations, messageableUsers, active }: Props) {
    const [body, setBody] = useState('');
    const [startingWith, setStartingWith] = useState('');

    function sendMessage(e: FormEvent) {
        e.preventDefault();
        if (!active || !body.trim()) return;
        router.post(route('messages.send', active.id), { body }, { preserveScroll: true, onSuccess: () => setBody('') });
    }

    function startConversation() {
        if (!startingWith) return;
        router.post(route('messages.start'), { recipient_user_id: startingWith });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Messages" />
            <div className="space-y-6">
                <PageHeader icon={Bell} title="Messages" subtitle="Conversations with employers, offices, and mentors." />

                <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-3">
                    <div className="border-border lg:col-span-1 lg:border-r">
                        {messageableUsers.length > 0 && (
                            <div className="flex gap-2 border-b border-border p-3">
                                <select value={startingWith} onChange={(e) => setStartingWith(e.target.value)}
                                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="">New conversation with…</option>
                                    {messageableUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <button onClick={startConversation} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-blue-700">Start</button>
                            </div>
                        )}
                        {conversations.map((c) => (
                            <Link key={c.id} href={route('messages.show', c.id)}
                                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted ${active?.id === c.id ? 'bg-muted' : ''}`}>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                                    {c.other ? initials(c.other.name) : '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="truncate text-sm font-semibold text-foreground">{c.other?.name ?? 'Unknown'}</p>
                                        {c.last_message_at && <span className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleDateString()}</span>}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">{c.last_message ?? 'No messages yet'}</p>
                                </div>
                                {c.unread && <span className="ml-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                            </Link>
                        ))}
                        {conversations.length === 0 && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
                        )}
                    </div>

                    <div className="flex min-h-[26rem] flex-col lg:col-span-2">
                        {active ? (
                            <>
                                <div className="border-b border-border px-5 py-3">
                                    <p className="font-semibold text-foreground">{active.other?.name ?? 'Unknown'}</p>
                                </div>
                                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                                    {active.messages.map((m) => (
                                        <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                {m.body}
                                            </div>
                                        </div>
                                    ))}
                                    {active.messages.length === 0 && <p className="text-center text-sm text-muted-foreground">Say hello!</p>}
                                </div>
                                <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3">
                                    <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…"
                                        className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:bg-card focus:outline-none" />
                                    <button type="submit" className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                                        <Send size={15} /> Send
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                                Select a conversation, or start a new one.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

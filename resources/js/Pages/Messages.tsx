import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Bell, Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

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
    const threadRef = useRef<HTMLDivElement>(null);

    // Open on the newest message rather than the top of the history.
    useEffect(() => {
        const thread = threadRef.current;

        if (thread) {
            thread.scrollTop = thread.scrollHeight;
        }
    }, [active?.id, active?.messages.length]);

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
                    {/*
                        Below `lg` the list and the thread cannot sit side by side, so
                        only one shows at a time: opening a conversation swaps the list
                        out for the thread, which carries a back link.
                    */}
                    <div className={`border-border lg:col-span-1 lg:block lg:border-r ${active ? 'hidden' : 'block'}`}>
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

                    {/*
                        A bounded height so the thread scrolls inside itself instead of
                        stretching the page, which on a phone pushed the composer below
                        the fold.
                    */}
                    <div className={`h-[calc(100dvh-16rem)] min-h-[22rem] flex-col lg:col-span-2 lg:flex lg:h-[34rem] ${active ? 'flex' : 'hidden lg:flex'}`}>
                        {active ? (
                            <>
                                <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
                                    <Link
                                        href={route('messages')}
                                        className="tap-target -ml-2 rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
                                        aria-label="Back to conversations"
                                    >
                                        <ArrowLeft size={18} />
                                    </Link>
                                    <p className="min-w-0 truncate font-semibold text-foreground">{active.other?.name ?? 'Unknown'}</p>
                                </div>
                                <div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                                    {active.messages.map((m) => (
                                        <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm [overflow-wrap:anywhere] sm:max-w-[75%] ${m.mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                {m.body}
                                            </div>
                                        </div>
                                    ))}
                                    {active.messages.length === 0 && <p className="text-center text-sm text-muted-foreground">Say hello!</p>}
                                </div>
                                <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3">
                                    <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…"
                                        className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:bg-card focus:outline-none" />
                                    <button type="submit" aria-label="Send message" className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 sm:px-4">
                                        <Send size={15} /> <span className="hidden sm:inline">Send</span>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                                Select a conversation, or start a new one.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

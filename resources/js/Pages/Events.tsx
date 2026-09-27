import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface EventItem {
    id: number; title: string; description: string | null; type: string;
    location: string | null; starts_at: string; ends_at: string | null;
    capacity: number | null; status: string; created_by: string;
    going_count: number; my_rsvp: string | null;
}
interface Props extends PageProps { events: EventItem[]; canManage: boolean }

const TYPE_LABELS: Record<string, string> = {
    career_fair: 'Career Fair', workshop: 'Workshop', networking: 'Networking',
    seminar: 'Seminar', other: 'Other',
};

function CreateEventForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '', description: '', type: 'other', location: '',
        starts_at: '', ends_at: '', capacity: '', status: 'published',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post(route('events.store'), { onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <input type="text" placeholder="Title *" value={data.title} onChange={(e) => setData('title', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            <textarea placeholder="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="form-grid-tight">
                <select value={data.type} onChange={(e) => setData('type', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input type="text" placeholder="Location" value={data.location} onChange={(e) => setData('location', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="datetime-local" placeholder="Ends" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" placeholder="Capacity (optional)" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <select value={data.status} onChange={(e) => setData('status', e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>
            {errors.starts_at && <p className="text-xs text-destructive">{errors.starts_at}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onDone} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">Create</button>
            </div>
        </form>
    );
}

export default function Events({ events, canManage }: Props) {
    const [showForm, setShowForm] = useState(false);

    function rsvp(eventId: number, status: string) {
        router.post(route('events.rsvp', eventId), { status }, { preserveScroll: true });
    }

    function destroy(id: number) {
        if (!confirm('Delete this event?')) return;
        router.delete(route('events.destroy', id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Events" />
            <div className="space-y-6">
                <PageHeader
                    icon={Calendar}
                    title="Events"
                    subtitle="Career fairs, workshops, and alumni & student gatherings."
                    action={canManage ? (
                        <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            {showForm ? 'Cancel' : 'Create event'}
                        </button>
                    ) : undefined}
                />

                {showForm && <CreateEventForm onDone={() => setShowForm(false)} />}

                <div className="grid gap-4 sm:grid-cols-2">
                    {events.map((e) => (
                        <div key={e.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-blue-500/15">{TYPE_LABELS[e.type] ?? e.type}</span>
                                    <h3 className="mt-2 font-semibold text-foreground">{e.title}</h3>
                                </div>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{e.status}</span>
                            </div>
                            {e.description && <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>}
                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2"><Calendar size={14} /> {new Date(e.starts_at).toLocaleString()}</p>
                                {e.location && <p className="flex items-center gap-2"><MapPin size={14} /> {e.location}</p>}
                                <p className="flex items-center gap-2"><Users size={14} /> {e.going_count}{e.capacity ? ` / ${e.capacity}` : ''} going</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {['going', 'interested'].map((s) => (
                                        <button key={s} onClick={() => rsvp(e.id, s)}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${e.my_rsvp === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'}`}>
                                            {s === 'going' ? "I'm going" : 'Interested'}
                                        </button>
                                    ))}
                                </div>
                                {canManage && (
                                    <button onClick={() => destroy(e.id)} className="text-xs text-destructive hover:text-destructive">Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="col-span-full py-12 text-center text-muted-foreground">No events yet.</p>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

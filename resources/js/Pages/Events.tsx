import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Calendar, MapPin, Users } from 'lucide-react';

const EVENTS = [
    { title: 'UCLM Career Fair 2026', date: 'Aug 14, 2026', type: 'Career Fair', location: 'UCLM Gymnasium', attendees: 820, tag: 'Upcoming' },
    { title: 'Tech Alumni Homecoming', date: 'Sep 3, 2026', type: 'Networking', location: 'Mandaue Campus', attendees: 340, tag: 'Upcoming' },
    { title: 'Resume Building Workshop', date: 'Jul 22, 2026', type: 'Workshop', location: 'Online', attendees: 210, tag: 'Registration open' },
    { title: 'Industry Partner Mixer', date: 'Oct 10, 2026', type: 'Networking', location: 'Cebu City', attendees: 120, tag: 'Planning' },
];

export default function Events() {
    return (
        <AuthenticatedLayout>
            <Head title="Events" />
            <div className="space-y-6">
                <PageHeader
                    icon={Calendar}
                    title="Events"
                    subtitle="Career fairs, workshops, and alumni gatherings."
                    action={<button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">Create event</button>}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    {EVENTS.map((e) => (
                        <div key={e.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-blue-500/15">{e.type}</span>
                                    <h3 className="mt-2 font-semibold text-foreground">{e.title}</h3>
                                </div>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{e.tag}</span>
                            </div>
                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2"><Calendar size={14} /> {e.date}</p>
                                <p className="flex items-center gap-2"><MapPin size={14} /> {e.location}</p>
                                <p className="flex items-center gap-2"><Users size={14} /> {e.attendees} registered</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

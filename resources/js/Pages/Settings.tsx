import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

const TABS = ['Account', 'Password', 'Notifications', 'Privacy', 'Theme'];

const NOTIF_PREFS: Array<[string, string, boolean]> = [
    ['Job Matches', 'New AI-matched roles for your profile', true],
    ['Application Updates', 'Status changes on your applications', true],
    ['Event Notifications', 'Career fairs, workshops, and alumni events', true],
    ['Survey Reminders', 'Open tracer and employability surveys', false],
    ['Messages', 'New messages from employers and offices', true],
];

function Toggle({ on }: { on: boolean }) {
    const [enabled, setEnabled] = useState(on);
    return (
        <button onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

export default function Settings() {
    const { auth } = usePage<PageProps>().props;
    const [tab, setTab] = useState('Account');

    return (
        <AuthenticatedLayout>
            <Head title="Settings" />
            <div className="space-y-6">
                <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your account, notifications, and preferences." />

                <div className="grid gap-6 lg:grid-cols-4">
                    <div className="space-y-1 lg:col-span-1">
                        {TABS.map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
                        {tab === 'Account' && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-foreground">Account</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Full name" value={auth.user.name} />
                                    <Field label="Email" value={auth.user.email} />
                                    <Field label="Role" value={auth.user.roles[0]?.replace(/_/g, ' ') ?? '—'} />
                                    <Field label="College" value={auth.user.department?.name ?? '—'} />
                                </div>
                                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">Save changes</button>
                            </div>
                        )}
                        {tab === 'Notifications' && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-foreground">Notification Preferences</h2>
                                {NOTIF_PREFS.map(([title, desc, on]) => (
                                    <div key={title} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{title}</p>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                        </div>
                                        <Toggle on={on} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {tab === 'Password' && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-foreground">Change Password</h2>
                                <Field label="Current password" value="" type="password" />
                                <Field label="New password" value="" type="password" />
                                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">Update password</button>
                            </div>
                        )}
                        {(tab === 'Privacy' || tab === 'Theme') && (
                            <p className="text-sm text-muted-foreground">{tab} preferences will appear here.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
            <input type={type} defaultValue={value} className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:bg-card focus:outline-none" />
        </div>
    );
}

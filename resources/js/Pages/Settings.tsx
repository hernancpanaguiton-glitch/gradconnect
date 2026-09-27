import { roleLabel } from '@/lib/roles';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/hooks/useTheme';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

interface Preference { key: string; label: string; description: string; enabled: boolean }
interface Props extends PageProps {
    account: {
        first_name: string;
        last_name: string;
        email: string;
        role: string | null;
        department: string | null;
        email_verified: boolean;
    };
    notificationPreferences: Preference[];
}

const TABS = ['Account', 'Password', 'Notifications', 'Privacy', 'Theme'] as const;

const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!enabled)}
            aria-pressed={enabled}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

function AccountTab({ account }: { account: Props['account'] }) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <h2 className="font-bold text-foreground">Account</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">First name</label>
                    <input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} className={inputClass} />
                    {errors.first_name && <p className="mt-1 text-xs text-destructive">{errors.first_name}</p>}
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Last name</label>
                    <input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} className={inputClass} />
                    {errors.last_name && <p className="mt-1 text-xs text-destructive">{errors.last_name}</p>}
                </div>
                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                    <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className={inputClass} />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                    {!account.email_verified && (
                        <p className="mt-1 text-xs text-amber-600">This email address is not verified.</p>
                    )}
                </div>
            </div>

            {/* Read-only: role and college are assigned by an administrator. */}
            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm text-foreground">{account.role ? roleLabel(account.role) : '—'}</p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">College</p>
                    <p className="mt-1 text-sm text-foreground">{account.department ?? '—'}</p>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">Role and college are set by an administrator.</p>
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={processing}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">
                    Save changes
                </button>
                {recentlySuccessful && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
        </form>
    );
}

function PasswordTab() {
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <form onSubmit={submit} className="max-w-md space-y-4">
            <h2 className="font-bold text-foreground">Change Password</h2>
            <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Current password</label>
                <input type="password" autoComplete="current-password" value={data.current_password}
                    onChange={(e) => setData('current_password', e.target.value)} className={inputClass} />
                {errors.current_password && <p className="mt-1 text-xs text-destructive">{errors.current_password}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium text-foreground">New password</label>
                <input type="password" autoComplete="new-password" value={data.password}
                    onChange={(e) => setData('password', e.target.value)} className={inputClass} />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Confirm new password</label>
                <input type="password" autoComplete="new-password" value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)} className={inputClass} />
                {errors.password_confirmation && <p className="mt-1 text-xs text-destructive">{errors.password_confirmation}</p>}
            </div>
            <div className="flex items-center gap-3">
                <button type="submit" disabled={processing}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">
                    Update password
                </button>
                {recentlySuccessful && <span className="text-sm text-emerald-600">Password updated.</span>}
            </div>
        </form>
    );
}

function NotificationsTab({ preferences }: { preferences: Preference[] }) {
    const [prefs, setPrefs] = useState(preferences);
    const [saving, setSaving] = useState(false);

    // Two toggles flipped in one tick both read the same render snapshot, so
    // the second request sent the first toggle's old value and that is what
    // was persisted. A ref advances synchronously, so each call sees the
    // previous one — without putting a request inside a state updater, which
    // must stay pure.
    const latest = useRef(prefs);

    function update(key: string, enabled: boolean) {
        const next = latest.current.map((preference) =>
            preference.key === key ? { ...preference, enabled } : preference
        );

        latest.current = next;
        setPrefs(next);
        setSaving(true);

        router.patch(route('settings.notifications.update'),
            { preferences: next.map((p) => ({ key: p.key, enabled: p.enabled })) },
            { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) },
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">Notification Preferences</h2>
                {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
            </div>
            <p className="text-xs text-muted-foreground">
                Turning a category off stops both the in-app notification and the email. Account
                and security messages are always sent.
            </p>
            {prefs.map((p) => (
                <div key={p.key} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-foreground">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <Toggle enabled={p.enabled} onChange={(v) => update(p.key, v)} />
                </div>
            ))}
        </div>
    );
}

function ThemeTab() {
    const { theme, isDark, toggle } = useTheme();

    return (
        <div className="space-y-4">
            <h2 className="font-bold text-foreground">Theme</h2>
            <p className="text-xs text-muted-foreground">
                Your choice is remembered on this device.
            </p>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                    {isDark ? <Moon size={18} className="text-muted-foreground" /> : <Sun size={18} className="text-muted-foreground" />}
                    <div>
                        <p className="text-sm font-medium capitalize text-foreground">{theme} mode</p>
                        <p className="text-xs text-muted-foreground">Switch between light and dark.</p>
                    </div>
                </div>
                <Toggle enabled={isDark} onChange={toggle} />
            </div>
        </div>
    );
}

export default function Settings({ account, notificationPreferences }: Props) {
    const [tab, setTab] = useState<(typeof TABS)[number]>('Account');

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
                        {tab === 'Account' && <AccountTab account={account} />}
                        {tab === 'Password' && <PasswordTab />}
                        {tab === 'Notifications' && <NotificationsTab preferences={notificationPreferences} />}
                        {tab === 'Theme' && <ThemeTab />}
                        {tab === 'Privacy' && (
                            <div className="space-y-6">
                                <h2 className="font-bold text-foreground">Privacy &amp; Your Data</h2>
                                <p className="text-sm text-muted-foreground">
                                    Under the Data Privacy Act of 2012 (RA 10173), you can download a copy of your data
                                    or request account deletion at any time. See our{' '}
                                    <Link href="/privacy" className="text-primary underline" target="_blank">Privacy Policy</Link> for details.
                                </p>
                                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Export my data</p>
                                        <p className="text-xs text-muted-foreground">Download your profile, records, and application history as a JSON file.</p>
                                    </div>
                                    <a href={route('account.export')}
                                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                                        <Download size={15} /> Export
                                    </a>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Delete my account</p>
                                        <p className="text-xs text-muted-foreground">Permanently erase your account and associated data.</p>
                                    </div>
                                    <Link href={route('profile.edit')} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-500/10">
                                        Go to Account Page
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

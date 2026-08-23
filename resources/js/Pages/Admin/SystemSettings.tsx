import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Settings as SettingsIcon } from 'lucide-react';
import { FormEvent } from 'react';

interface Props extends PageProps {
    settings: {
        registration_enabled: boolean;
        support_email: string;
        maintenance_banner_message: string;
        matching_min_fit_score: number;
    };
}

export default function SystemSettings({ settings }: Props) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        registration_enabled: settings.registration_enabled,
        support_email: settings.support_email,
        maintenance_banner_message: settings.maintenance_banner_message,
        matching_min_fit_score: settings.matching_min_fit_score,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        patch(route('admin.settings.update'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="System Settings" />
            <div className="max-w-2xl space-y-6">
                <PageHeader icon={SettingsIcon} title="System Settings" subtitle="Platform-wide configuration (FDD Admin)." />

                <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">Allow new registrations</p>
                            <p className="text-xs text-muted-foreground">When off, the registration page rejects new sign-ups.</p>
                        </div>
                        <button type="button" onClick={() => setData('registration_enabled', !data.registration_enabled)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${data.registration_enabled ? 'bg-primary' : 'bg-muted'}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${data.registration_enabled ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Support email</label>
                        <input type="email" value={data.support_email} onChange={(e) => setData('support_email', e.target.value)}
                            placeholder="support@gradconnect.edu.ph"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        {errors.support_email && <p className="mt-1 text-xs text-red-500">{errors.support_email}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Site-wide banner</label>
                        <p className="mb-2 text-xs text-muted-foreground">Shown to every signed-in user until cleared. Leave blank to hide.</p>
                        <textarea value={data.maintenance_banner_message} onChange={(e) => setData('maintenance_banner_message', e.target.value)} rows={2}
                            placeholder="e.g. Scheduled maintenance this Saturday, 10 PM–12 AM."
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        {errors.maintenance_banner_message && <p className="mt-1 text-xs text-red-500">{errors.maintenance_banner_message}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Minimum AI fit score</label>
                        <p className="mb-2 text-xs text-muted-foreground">
                            Recommendations scored below this are hidden from graduates. Tune this using the helpful/not-helpful
                            rate on the Platform Status page — this is the actual "AI tuning" lever available with an
                            API-based LLM (there's no local model here to retrain).
                        </p>
                        <input type="number" min={0} max={100} value={data.matching_min_fit_score}
                            onChange={(e) => setData('matching_min_fit_score', Number(e.target.value))}
                            className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        {errors.matching_min_fit_score && <p className="mt-1 text-xs text-red-500">{errors.matching_min_fit_score}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700 disabled:opacity-50">
                            Save Settings
                        </button>
                        {recentlySuccessful && <span className="text-sm text-emerald-600">Saved.</span>}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

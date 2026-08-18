import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, CheckCircle2, MapPin, TrendingUp } from 'lucide-react';

interface EmploymentRecord {
    id: number;
    company_name: string;
    job_title: string;
    employment_type: string;
    industry: string | null;
    location: string | null;
    is_current: boolean;
    is_related_to_course: boolean | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
}

interface Props {
    hasProfile: boolean;
    records: EmploymentRecord[];
}

function formatMonthYear(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export default function CareerProgression({ hasProfile, records }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Career Progression" />
            <div className="space-y-6">
                <PageHeader
                    icon={TrendingUp}
                    title="Career Progression"
                    subtitle="Your employment history, most recent first — this is what feeds your Employment Rate on institutional reports."
                    action={(
                        <Link href={route('graduate.profile.edit')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Add / Edit Employment
                        </Link>
                    )}
                />

                {!hasProfile && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">Complete your graduate profile to start tracking your career progression.</p>
                        <Link href={route('graduate.profile.edit')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Complete My Profile
                        </Link>
                    </div>
                )}

                {hasProfile && records.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">No employment records yet. Add your current or past jobs to build your timeline.</p>
                        <Link href={route('graduate.profile.edit')} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                            Add Employment
                        </Link>
                    </div>
                )}

                {hasProfile && records.length > 0 && (
                    <ol className="relative space-y-6 border-l border-border pl-6">
                        {records.map((r) => (
                            <li key={r.id} className="relative">
                                <span className={`absolute -left-[1.95rem] top-1.5 flex h-3 w-3 rounded-full ring-4 ring-background ${r.is_current ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-foreground">{r.job_title}</p>
                                            <p className="text-sm text-muted-foreground">{r.company_name}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {r.is_current && (
                                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                    <CheckCircle2 size={12} /> Current
                                                </span>
                                            )}
                                            {r.is_related_to_course && (
                                                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                                    Related to Degree
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Briefcase size={12} /> {r.employment_type.replace(/_/g, ' ')}</span>
                                        <span>{formatMonthYear(r.start_date)} – {r.is_current ? 'Present' : formatMonthYear(r.end_date)}</span>
                                        {r.industry && <span>{r.industry}</span>}
                                        {r.location && <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>}
                                    </div>

                                    {r.description && (
                                        <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

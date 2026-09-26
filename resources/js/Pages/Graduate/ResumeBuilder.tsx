import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

interface EducationRecord {
    id: number; institution: string; degree: string; field_of_study: string | null;
    start_year: number | null; end_year: number | null; honors: string | null;
}
interface EmploymentRecord {
    id: number; company_name: string; job_title: string; employment_type: string;
    is_current: boolean; start_date: string | null; end_date: string | null;
    industry: string | null; location: string | null; description: string | null;
}
interface Skill { id: number; name: string }
interface Profile {
    id: number; program: string | null; headline: string | null; summary: string | null;
    phone: string | null; city: string | null; linkedin_url: string | null;
    department: { id: number; name: string } | null;
    education_records: EducationRecord[];
    employment_records: EmploymentRecord[];
    skills: Skill[];
}
interface Props extends PageProps { profile: Profile }

function formatYear(y: number | null): string {
    return y ? String(y) : '—';
}

function formatMonthYear(value: string | null): string {
    // Not "Present": the caller already handles a current role via is_current,
    // and a past job left without an end date was printing as though the
    // graduate still worked there — on a document they send to employers.
    if (!value) {
        return '?';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export default function ResumeBuilder({ profile }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [saving, setSaving] = useState(false);

    // Mirrors GraduateProfile::buildProfileText(), which the server uses to
    // decide whether a résumé can be built. It counts `program`, so a
    // graduate with only a program saw "your profile is empty" and a disabled
    // button for something the server would have built happily.
    const hasContent = Boolean(
        profile.program || profile.headline || profile.summary || profile.skills.length ||
        profile.education_records.length || profile.employment_records.length,
    );

    function saveAsResume() {
        setSaving(true);
        router.post(route('resume-builder.store'), {}, {
            onFinish: () => setSaving(false),
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Résumé Builder" />
            <div className="mx-auto max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Résumé Builder</h1>
                        <p className="mt-1 text-sm text-gray-500">Generated automatically from your profile, education, employment, and skills.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Printer size={16} /> Print / Save as PDF
                        </button>
                        <button onClick={saveAsResume} disabled={saving || !hasContent}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            <Download size={16} /> Save as My Resume
                        </button>
                    </div>
                </div>

                {!hasContent && (
                    <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200 print:hidden">
                        Your profile is empty. <Link href={route('graduate.profile.edit')} className="font-medium underline">Add your headline, skills, education, or employment</Link> first.
                    </div>
                )}

                {/* The résumé itself — this is what prints. */}
                <div className="rounded-xl bg-white p-10 shadow-sm ring-1 ring-gray-200 print:rounded-none print:p-0 print:shadow-none print:ring-0">
                    <div className="border-b-2 border-gray-800 pb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{user.name}</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            {[user.email, profile.phone, profile.city, profile.linkedin_url].filter(Boolean).join('  •  ')}
                        </p>
                        {profile.headline && <p className="mt-2 font-medium text-indigo-700">{profile.headline}</p>}
                    </div>

                    {profile.summary && (
                        <section className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Summary</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-700">{profile.summary}</p>
                        </section>
                    )}

                    {profile.skills.length > 0 && (
                        <section className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills</h3>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {profile.skills.map((s) => (
                                    <span key={s.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 print:border print:border-gray-300">
                                        {s.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile.employment_records.length > 0 && (
                        <section className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Experience</h3>
                            <div className="mt-2 space-y-4">
                                {profile.employment_records.map((rec) => (
                                    <div key={rec.id}>
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                            <p className="font-semibold text-gray-900">{rec.job_title} — {rec.company_name}</p>
                                            <p className="text-xs text-gray-500">{formatMonthYear(rec.start_date)} – {rec.is_current ? 'Present' : formatMonthYear(rec.end_date)}</p>
                                        </div>
                                        {(rec.industry || rec.location) && (
                                            <p className="text-xs text-gray-500">{[rec.industry, rec.location].filter(Boolean).join(' · ')}</p>
                                        )}
                                        {rec.description && <p className="mt-1 text-sm text-gray-700">{rec.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile.education_records.length > 0 && (
                        <section className="mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Education</h3>
                            <div className="mt-2 space-y-3">
                                {profile.education_records.map((rec) => (
                                    <div key={rec.id}>
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                            <p className="font-semibold text-gray-900">{rec.degree}{rec.field_of_study ? ` in ${rec.field_of_study}` : ''}</p>
                                            <p className="text-xs text-gray-500">{formatYear(rec.start_year)} – {formatYear(rec.end_year)}</p>
                                        </div>
                                        <p className="text-sm text-gray-700">{rec.institution}{rec.honors ? ` — ${rec.honors}` : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

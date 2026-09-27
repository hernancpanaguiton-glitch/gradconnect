import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Skill { id: number; name: string }
interface EducationRecord {
    id: number; institution: string; degree: string; field_of_study: string | null;
    start_year: number | null; end_year: number | null; honors: string | null;
}
interface EmploymentRecord {
    id: number; company_name: string; job_title: string; employment_type: string;
    is_current: boolean; start_date: string | null; end_date: string | null;
}
interface Resume { id: number; original_filename: string; is_primary: boolean; size_bytes: number | null; can_download: boolean }
interface Profile {
    id: number;
    program: string | null;
    headline: string | null;
    summary: string | null;
    city: string | null;
    linkedin_url: string | null;
    current_employment_status: string | null;
    willing_to_relocate: boolean;
    // Email is only serialized for viewers with an institutional role or an
    // application from this graduate — see App\Http\Presenters\CandidatePresenter.
    user: { name: string; email?: string };
    department: { id: number; name: string } | null;
    skills: Skill[];
    education_records: EducationRecord[];
    employment_records: EmploymentRecord[];
    resumes: Resume[];
}
interface Props extends PageProps { profile: Profile }

const STATUS_LABELS: Record<string, string> = {
    employed: 'Employed', unemployed: 'Unemployed', self_employed: 'Self-Employed',
    further_study: 'Further Study', not_seeking: 'Not Seeking',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
            {children}
        </div>
    );
}

export default function CandidateShow({ profile }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={profile.user.name} />

            <div className="max-w-3xl space-y-5">
                <Link href={route('postings.index')} className="text-sm text-primary hover:text-indigo-800">← Back</Link>

                {/* Header */}
                <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200">
                    <h1 className="break-words text-xl font-bold text-foreground sm:text-2xl">{profile.user.name}</h1>
                    {profile.headline && <p className="mt-1 text-muted-foreground">{profile.headline}</p>}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {profile.user.email && <span className="break-all">{profile.user.email}</span>}
                        {profile.department && <span>· {profile.department.name}</span>}
                        {profile.program && <span>· {profile.program}</span>}
                        {profile.city && <span>· {profile.city}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {profile.current_employment_status && (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                                {STATUS_LABELS[profile.current_employment_status] ?? profile.current_employment_status}
                            </span>
                        )}
                        {profile.willing_to_relocate && (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Willing to relocate</span>
                        )}
                        {profile.linkedin_url && (
                            <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                                className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                                LinkedIn ↗
                            </a>
                        )}
                    </div>
                </div>

                {/* Résumés */}
                <Section title="Résumés">
                    {profile.resumes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No résumé uploaded.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {profile.resumes.map((resume) => (
                                <li key={resume.id} className="flex items-center justify-between py-2">
                                    <span className="text-sm text-foreground">
                                        {resume.original_filename}
                                        {resume.is_primary && <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">Primary</span>}
                                    </span>
                                    {resume.can_download ? (
                                        <a href={route('candidates.resume', resume.id)} target="_blank" rel="noreferrer"
                                            className="text-sm font-medium text-primary hover:text-indigo-800">
                                            View / Download
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Available once they apply to you</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {profile.summary && (
                    <Section title="Summary">
                        <p className="whitespace-pre-line text-sm text-foreground">{profile.summary}</p>
                    </Section>
                )}

                {profile.skills.length > 0 && (
                    <Section title="Skills">
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                                <span key={skill.id} className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">{skill.name}</span>
                            ))}
                        </div>
                    </Section>
                )}

                {profile.education_records.length > 0 && (
                    <Section title="Education">
                        <div className="space-y-3">
                            {profile.education_records.map((rec) => (
                                <div key={rec.id}>
                                    <p className="font-medium text-foreground">{rec.institution}</p>
                                    <p className="text-sm text-muted-foreground">{rec.degree}{rec.field_of_study ? ` — ${rec.field_of_study}` : ''}</p>
                                    {(rec.start_year || rec.end_year) && <p className="text-xs text-muted-foreground">{rec.start_year ?? '?'} – {rec.end_year ?? 'present'}</p>}
                                    {rec.honors && <p className="text-xs text-primary">{rec.honors}</p>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {profile.employment_records.length > 0 && (
                    <Section title="Employment">
                        <div className="space-y-3">
                            {profile.employment_records.map((rec) => (
                                <div key={rec.id}>
                                    <p className="font-medium text-foreground">{rec.job_title}</p>
                                    <p className="text-sm text-muted-foreground">{rec.company_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {rec.employment_type.replace(/_/g, ' ')}{rec.is_current ? ' · Current' : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

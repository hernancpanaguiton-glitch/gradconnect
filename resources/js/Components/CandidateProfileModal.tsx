import axios from 'axios';
import { useEffect, useState } from 'react';

interface Skill { id: number; name: string }
interface EducationRecord {
    id: number; institution: string; degree: string; field_of_study: string | null;
    start_year: number | null; end_year: number | null; honors: string | null;
}
interface EmploymentRecord {
    id: number; company_name: string; job_title: string; employment_type: string; is_current: boolean;
}
interface Resume { id: number; original_filename: string; is_primary: boolean; can_download: boolean }
interface Profile {
    id: number; program: string | null; headline: string | null; summary: string | null;
    city: string | null; linkedin_url: string | null;
    current_employment_status: string | null; willing_to_relocate: boolean;
    // Email is only serialized for viewers with an institutional role or an
    // application from this graduate — see App\Http\Presenters\CandidatePresenter.
    user: { name: string; email?: string };
    department: { id: number; name: string } | null;
    skills: Skill[];
    education_records: EducationRecord[];
    employment_records: EmploymentRecord[];
    resumes: Resume[];
}

const STATUS_LABELS: Record<string, string> = {
    employed: 'Employed', unemployed: 'Unemployed', self_employed: 'Self-Employed',
    further_study: 'Further Study', not_seeking: 'Not Seeking',
};

export default function CandidateProfileModal({ profileId, onClose }: { profileId: number; onClose: () => void }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        axios.get(route('candidates.data', profileId))
            .then((r) => { if (active) setProfile(r.data.profile); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [profileId]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between border-b border-gray-100 p-5">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-foreground">{profile?.user.name ?? 'Candidate'}</h2>
                        {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
                    </div>
                    <button onClick={onClose} className="ml-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground" aria-label="Close">✕</button>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
                    {error && <p className="text-sm text-destructive">Could not load this candidate.</p>}
                    {!profile && !error && <p className="text-sm text-muted-foreground">Loading…</p>}

                    {profile && (
                        <>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {profile.user.email && <span className="break-all">{profile.user.email}</span>}
                                {profile.department && <span>· {profile.department.name}</span>}
                                {profile.program && <span>· {profile.program}</span>}
                                {profile.city && <span>· {profile.city}</span>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {profile.current_employment_status && (
                                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                                        {STATUS_LABELS[profile.current_employment_status] ?? profile.current_employment_status}
                                    </span>
                                )}
                                {profile.willing_to_relocate && (
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Willing to relocate</span>
                                )}
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">LinkedIn ↗</a>
                                )}
                            </div>

                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résumés</h3>
                                {profile.resumes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No résumé uploaded.</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {profile.resumes.map((resume) => (
                                            <li key={resume.id} className="flex items-center justify-between">
                                                <span className="text-sm text-foreground">
                                                    {resume.original_filename}
                                                    {resume.is_primary && <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">Primary</span>}
                                                </span>
                                                {resume.can_download ? (
                                                    <a href={route('candidates.resume', resume.id)} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:text-indigo-800">View / Download</a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Available once they apply to you</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {profile.summary && (
                                <div>
                                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h3>
                                    <p className="whitespace-pre-line text-sm text-foreground">{profile.summary}</p>
                                </div>
                            )}

                            {profile.skills.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill) => (
                                            <span key={skill.id} className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">{skill.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.education_records.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</h3>
                                    <div className="space-y-2">
                                        {profile.education_records.map((rec) => (
                                            <div key={rec.id}>
                                                <p className="text-sm font-medium text-foreground">{rec.institution}</p>
                                                <p className="text-xs text-muted-foreground">{rec.degree}{rec.field_of_study ? ` — ${rec.field_of_study}` : ''}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile.employment_records.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment</h3>
                                    <div className="space-y-2">
                                        {profile.employment_records.map((rec) => (
                                            <div key={rec.id}>
                                                <p className="text-sm font-medium text-foreground">{rec.job_title}</p>
                                                <p className="text-xs text-muted-foreground">{rec.company_name}{rec.is_current ? ' · Current' : ''}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

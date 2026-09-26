import Pagination from '@/Components/Pagination';
import TableCard from '@/Components/TableCard';
import CandidateProfileModal from '@/Components/CandidateProfileModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Fragment, FormEvent, useState } from 'react';

interface CompetencyRatings {
    technical_skills?: number;
    communication?: number;
    problem_solving?: number;
    teamwork?: number;
    adaptability?: number;
    [key: string]: number | undefined;
}

interface EmployerFeedback {
    id: number;
    overall_rating: number;
    competency_ratings: CompetencyRatings | null;
    comments: string | null;
}

interface Applicant {
    id: number; status: string; applied_at: string | null; cover_letter: string | null;
    // Email is only serialized for viewers allowed to see it — see
    // App\Http\Presenters\CandidatePresenter.
    graduate_profile: { id: number; user: { name: string; email?: string }; current_employment_status: string | null; department: { id: number; name: string } | null };
    resume: { id: number; original_filename: string; can_download: boolean } | null;
    employer_feedback: EmployerFeedback | null;
}
interface Posting { id: number; title: string }
interface Props extends PageProps { posting: Posting; applications: { data: Applicant[]; total: number; links: Array<{ url: string | null; label: string; active: boolean }> } }

const statusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-emerald-100 text-emerald-700',
    withdrawn: 'bg-gray-100 text-gray-600',
};

const RATABLE_STATUSES = ['hired', 'rejected'];

/**
 * Statuses an employer may move an application to. 'submitted' is absent on
 * purpose — it is the applicant's own starting state and the backend rejects
 * it, so offering it here only produced a validation error.
 */
const ASSIGNABLE_STATUSES = ['under_review', 'shortlisted', 'rejected', 'hired'];

const COMPETENCIES: Array<{ key: keyof CompetencyRatings; label: string }> = [
    { key: 'technical_skills', label: 'Technical Skills' },
    { key: 'communication', label: 'Communication' },
    { key: 'problem_solving', label: 'Problem-Solving' },
    { key: 'teamwork', label: 'Teamwork' },
    { key: 'adaptability', label: 'Adaptability' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onChange(n)} className="text-amber-400">
                    <Star size={16} fill={n <= value ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
}

function FeedbackForm({ applicationId, onDone }: { applicationId: number; onDone: () => void }) {
    const [overall, setOverall] = useState(0);
    const [competencies, setCompetencies] = useState<CompetencyRatings>({});
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        if (overall === 0) return;
        setSubmitting(true);
        router.post(route('applications.feedback.store', applicationId), {
            overall_rating: overall,
            competency_ratings: competencies,
            comments: comments || undefined,
        }, {
            preserveScroll: true,
            onSuccess: onDone,
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
            <div>
                <p className="mb-1 text-xs font-medium text-gray-700">Overall Rating</p>
                <StarRating value={overall} onChange={setOverall} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COMPETENCIES.map((c) => (
                    <div key={c.key}>
                        <p className="mb-1 text-xs text-gray-600">{c.label}</p>
                        <StarRating
                            value={competencies[c.key] ?? 0}
                            onChange={(v) => setCompetencies((prev) => ({ ...prev, [c.key]: v }))}
                        />
                    </div>
                ))}
            </div>
            <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Additional comments (optional)"
                rows={2}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onDone} className="rounded px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={overall === 0 || submitting} className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    Submit Feedback
                </button>
            </div>
        </form>
    );
}

function FeedbackSummary({ feedback }: { feedback: EmployerFeedback }) {
    return (
        <div className="flex items-center gap-1 text-xs text-amber-600">
            <Star size={12} fill="currentColor" /> {feedback.overall_rating}/5 feedback submitted
        </div>
    );
}

export default function Candidates({ posting, applications }: Props) {
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [feedbackForm, setFeedbackForm] = useState<number | null>(null);

    function updateStatus(appId: number, status: string) {
        router.patch(route('applications.update-status', appId), { status }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Candidates — ${posting.title}`} />
            <div className="space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Postings</Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{posting.title}</h1>
                        <p className="text-gray-500 text-sm">{applications.total} applicant(s)</p>
                    </div>
                </div>
                <TableCard wide>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Applied</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Update</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">Feedback</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {applications.data.map((app) => (
                                <Fragment key={app.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            <button type="button" onClick={() => setSelectedCandidate(app.graduate_profile.id)}
                                                className="text-left hover:text-indigo-600 hover:underline">
                                                {app.graduate_profile.user.name}
                                            </button>
                                            {app.graduate_profile.department && (
                                                <span className="block text-xs font-normal text-gray-400">{app.graduate_profile.department.name}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{app.graduate_profile.user.email ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[app.status] ?? 'bg-gray-100'}`}>
                                                {app.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <select
                                                value={app.status}
                                                disabled={app.status === 'withdrawn'}
                                                onChange={(e) => updateStatus(app.id, e.target.value)}
                                                className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                            >
                                                {/* The applicant's own statuses are not assignable, but the
                                                    select still has to be able to show the current one. */}
                                                {!ASSIGNABLE_STATUSES.includes(app.status) && (
                                                    <option value={app.status}>{app.status.replace(/_/g, ' ')}</option>
                                                )}
                                                {ASSIGNABLE_STATUSES.map((s) => (
                                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {!RATABLE_STATUSES.includes(app.status) && <span className="text-xs text-gray-400">—</span>}
                                            {RATABLE_STATUSES.includes(app.status) && app.employer_feedback && (
                                                <FeedbackSummary feedback={app.employer_feedback} />
                                            )}
                                            {RATABLE_STATUSES.includes(app.status) && !app.employer_feedback && feedbackForm !== app.id && (
                                                <button type="button" onClick={() => setFeedbackForm(app.id)} className="text-xs font-medium text-indigo-600 hover:underline">
                                                    Give Feedback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {feedbackForm === app.id && (
                                        <tr>
                                            <td colSpan={6} className="bg-gray-50 px-4 py-3">
                                                <FeedbackForm applicationId={app.id} onDone={() => setFeedbackForm(null)} />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {applications.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No applications yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </TableCard>

                <Pagination links={applications.links} />
            </div>

            {selectedCandidate !== null && (
                <CandidateProfileModal profileId={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
            )}
        </AuthenticatedLayout>
    );
}

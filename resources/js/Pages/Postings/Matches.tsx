import FitScoreBar from '@/Components/FitScoreBar';
import SkillGapList from '@/Components/SkillGapList';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface Match {
    id: number;
    similarity: number | null;
    fit_score: number | null;
    explanation: string | null;
    skill_gaps: string[] | null;
    matched_skills: string[] | null;
    recommendation: string | null;
    graduate_profile: {
        id: number;
        headline: string | null;
        user: { name: string; email: string };
    };
    resume: { id: number; original_filename: string } | null;
}

interface Posting {
    id: number;
    title: string;
}

interface Props extends PageProps {
    posting: Posting;
    matches: Match[];
}

export default function PostingsMatches({ posting, matches }: Props) {
    const [requesting, setRequesting] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    function requestRematch() {
        setRequesting(true);
        setNotice(null);
        axios.post(route('api.jobs.rematch.store', posting.id))
            .then(() => {
                setNotice('Matching started. Candidate rankings will update once processing finishes — this page will refresh in a moment.');
                setTimeout(() => router.reload({ only: ['matches'] }), 4000);
            })
            .catch(() => setNotice('Could not start matching. Please try again.'))
            .finally(() => setRequesting(false));
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Matches — ${posting.title}`} />
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Postings</Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{posting.title}</h1>
                            <p className="text-gray-500 text-sm">{matches.length} AI-ranked candidate(s)</p>
                        </div>
                    </div>
                    <button
                        onClick={requestRematch}
                        disabled={requesting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {requesting ? 'Requesting…' : 'Refresh matches'}
                    </button>
                </div>

                {notice && (
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
                        {notice}
                    </div>
                )}

                <div className="space-y-3">
                    {matches.map((match) => (
                        <div key={match.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900">{match.graduate_profile.user.name}</p>
                                    <p className="text-sm text-gray-600 mt-0.5">{match.graduate_profile.user.email}</p>
                                    {match.graduate_profile.headline && (
                                        <p className="text-xs text-gray-400 mt-0.5">{match.graduate_profile.headline}</p>
                                    )}
                                    {match.resume && (
                                        <p className="text-xs text-gray-400 mt-1">Resume: {match.resume.original_filename}</p>
                                    )}
                                </div>
                                <div className="w-40 shrink-0">
                                    <FitScoreBar fitScore={match.fit_score} similarity={match.similarity} recommendation={match.recommendation} />
                                </div>
                            </div>
                            {match.explanation && <p className="mt-3 text-sm text-gray-600">{match.explanation}</p>}
                            <div className="mt-3">
                                <SkillGapList matchedSkills={match.matched_skills} skillGaps={match.skill_gaps} />
                            </div>
                        </div>
                    ))}
                    {matches.length === 0 && (
                        <p className="text-center py-12 text-gray-400">
                            No matches yet. Click &ldquo;Refresh matches&rdquo; once candidates have embedded resumes.
                        </p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

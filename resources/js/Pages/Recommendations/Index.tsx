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
    job_posting: {
        id: number;
        title: string;
        employment_type: string;
        location: string | null;
        is_remote: boolean;
        company: { id: number; name: string; industry: string | null };
    };
}

interface Props extends PageProps {
    matches: Match[];
    hasProfile: boolean;
}

export default function RecommendationsIndex({ matches, hasProfile }: Props) {
    const [requesting, setRequesting] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    function requestRematch() {
        setRequesting(true);
        setNotice(null);
        axios.post(route('api.me.rematch.store'))
            .then(() => {
                setNotice('Matching started. Your recommendations will update once processing finishes — this page will refresh in a moment.');
                setTimeout(() => router.reload({ only: ['matches'] }), 4000);
            })
            .catch(() => setNotice('Could not start matching. Please try again.'))
            .finally(() => setRequesting(false));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Recommendations" />
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Job Recommendations</h1>
                        <p className="mt-1 text-gray-500">AI-ranked jobs based on your resume.</p>
                    </div>
                    {hasProfile && (
                        <button
                            onClick={requestRematch}
                            disabled={requesting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {requesting ? 'Requesting…' : 'Refresh recommendations'}
                        </button>
                    )}
                </div>

                {notice && (
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
                        {notice}
                    </div>
                )}

                {!hasProfile && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                        Complete your graduate profile and upload a resume to get personalized recommendations.
                    </div>
                )}

                <div className="space-y-3">
                    {matches.map((match) => (
                        <div key={match.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <Link href={route('jobs.show', match.job_posting.id)} className="font-semibold text-gray-900 hover:text-indigo-600">
                                        {match.job_posting.title}
                                    </Link>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {match.job_posting.company.name}
                                        {match.job_posting.company.industry ? ` · ${match.job_posting.company.industry}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {match.job_posting.is_remote ? 'Remote' : (match.job_posting.location ?? 'On-site')}
                                    </p>
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
                    {matches.length === 0 && hasProfile && (
                        <p className="text-center py-12 text-gray-400">
                            No recommendations yet. Upload a resume and click &ldquo;Refresh recommendations&rdquo; to get started.
                        </p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

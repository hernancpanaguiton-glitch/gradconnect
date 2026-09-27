import FitScoreBar from '@/Components/FitScoreBar';
import SkillGapList from '@/Components/SkillGapList';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

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
        // The match list is a shortlist the employer has not engaged with, so
        // the backend never sends an email here.
        user: { name: string; email?: string };
    };
    resume: { id: number; original_filename: string; can_download: boolean } | null;
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
    const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Navigating away inside the wait would otherwise reload a page that is no
    // longer mounted, against whatever component replaced this one.
    useEffect(() => () => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current);
    }, []);

    function requestRematch() {
        setRequesting(true);
        setNotice(null);
        axios.post(route('api.jobs.rematch.store', posting.id))
            .then(() => {
                setNotice('Matching started. Candidate rankings will update once processing finishes — this page will refresh in a moment.');
                // Stay disabled until the refresh actually lands: re-enabling
                // when the POST resolves invites a second matching run, which
                // costs real AI spend for the same posting.
                reloadTimer.current = setTimeout(() => {
                    reloadTimer.current = null;
                    router.reload({ only: ['matches'] });
                    setRequesting(false);
                }, 4000);
            })
            .catch(() => {
                setNotice('Could not start matching. Please try again.');
                setRequesting(false);
            });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Matches — ${posting.title}`} />
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <Link href={route('postings.index')} className="text-sm text-primary hover:text-indigo-800">← Postings</Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{posting.title}</h1>
                            <p className="text-muted-foreground text-sm">{matches.length} AI-ranked candidate(s)</p>
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
                        <div key={match.id} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <div className="min-w-0 flex-1">
                                    <Link href={route('candidates.show', match.graduate_profile.id)}
                                        className="text-base font-semibold text-foreground hover:text-primary">
                                        {match.graduate_profile.user.name}
                                    </Link>
                                    {match.graduate_profile.headline && (
                                        <p className="text-sm text-muted-foreground mt-0.5">{match.graduate_profile.headline}</p>
                                    )}
                                    {match.graduate_profile.user.email && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{match.graduate_profile.user.email}</p>
                                    )}
                                    {match.resume && match.resume.can_download && (
                                        <a href={route('candidates.resume', match.resume.id)} target="_blank" rel="noreferrer"
                                            className="mt-1 inline-block text-xs font-medium text-primary hover:text-indigo-800">
                                            View résumé: {match.resume.original_filename}
                                        </a>
                                    )}
                                </div>
                                <div className="w-full sm:w-40 sm:shrink-0">
                                    <FitScoreBar fitScore={match.fit_score} similarity={match.similarity} recommendation={match.recommendation} />
                                </div>
                            </div>
                            {match.explanation && <p className="mt-3 text-sm text-muted-foreground">{match.explanation}</p>}
                            <div className="mt-3">
                                <SkillGapList matchedSkills={match.matched_skills} skillGaps={match.skill_gaps} />
                            </div>
                        </div>
                    ))}
                    {matches.length === 0 && (
                        <p className="text-center py-12 text-muted-foreground">
                            No matches yet. Click &ldquo;Refresh matches&rdquo; once candidates have embedded resumes.
                        </p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

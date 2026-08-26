import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Cpu, ListChecks, ThumbsUp, Target } from 'lucide-react';

interface FailedJob { uuid: string; connection: string; queue: string; failed_at: string }
interface ProviderRate { provider: string; total: number; helpfulRate: number }
interface HireCalibration { sampleSize: number; avgFitScore: number | null; avgEmployerRating: number | null }
interface Props extends PageProps {
    queueDepth: number;
    failedJobsCount: number;
    embeddingSuccessRate: number | null;
    matchScoringSuccessRate: number | null;
    recentFailedJobs: FailedJob[];
    queueReserved: number;
    queueOldestWaitMinutes: number | null;
    queueStalled: boolean;
    feedbackTotal: number;
    feedbackHelpfulRate: number | null;
    helpfulRateByProvider: ProviderRate[];
    hireCalibration: HireCalibration;
}

export default function PlatformStatus({
    queueDepth, failedJobsCount, embeddingSuccessRate, matchScoringSuccessRate, recentFailedJobs,
    queueOldestWaitMinutes, queueStalled,
    feedbackTotal, feedbackHelpfulRate, helpfulRateByProvider, hireCalibration,
}: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Platform Status" />
            <div className="space-y-6">
                <PageHeader icon={Cpu} title="Platform Status" subtitle="Queue health, AI pipeline success rates, and recommendation accuracy." />

                {queueStalled && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-500/10">
                        <p className="font-semibold text-amber-900 dark:text-amber-300">
                            No queue worker appears to be running
                        </p>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
                            {queueDepth} job{queueDepth === 1 ? '' : 's'} {queueDepth === 1 ? 'has' : 'have'} been waiting
                            for {queueOldestWaitMinutes} minute{queueOldestWaitMinutes === 1 ? '' : 's'} with nothing
                            picking them up. Résumé embeddings, AI match scoring, and all notification email stay pending
                            until a worker runs — start one with{' '}
                            <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">php artisan queue:work</code>{' '}
                            (or <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-500/20">composer dev</code>,
                            which runs one alongside the server).
                        </p>
                    </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={ListChecks} color="blue" label="Queued Jobs" value={queueDepth} sub="Waiting to run" />
                    <StatTile icon={AlertTriangle} color={failedJobsCount > 0 ? 'red' : 'green'} label="Failed Jobs" value={failedJobsCount} sub="All-time" />
                    <StatTile icon={Cpu} color="violet" label="Embedding Success" value={embeddingSuccessRate !== null ? `${embeddingSuccessRate}%` : '—'} sub="Résumés & postings embedded" />
                    <StatTile icon={Target} color="amber" label="AI Scoring Success" value={matchScoringSuccessRate !== null ? `${matchScoringSuccessRate}%` : '—'} sub="Matches scored by an AI provider" />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-1 font-semibold text-foreground">Recommendation Accuracy (Feedback Loop)</h2>
                    <p className="mb-4 text-xs text-muted-foreground">
                        From graduates rating their job recommendations as helpful or not — use this to tune the
                        "Minimum fit score" setting, not to retrain the AI (there's no local model to retrain).
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <StatTile icon={ThumbsUp} color="green" label="Helpful Rate" value={feedbackHelpfulRate !== null ? `${feedbackHelpfulRate}%` : '—'} sub={`${feedbackTotal} rating(s) submitted`} />
                        <div className="rounded-xl border border-border p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By AI Provider</p>
                            {helpfulRateByProvider.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No feedback yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {helpfulRateByProvider.map((p) => (
                                        <div key={p.provider} className="flex items-center justify-between text-sm">
                                            <span className="capitalize text-foreground">{p.provider}</span>
                                            <span className="text-muted-foreground">{p.helpfulRate}% helpful ({p.total})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hire Calibration</p>
                        {hireCalibration.sampleSize === 0 ? (
                            <p className="text-sm text-muted-foreground">No hired candidates with employer feedback yet.</p>
                        ) : (
                            <p className="text-sm text-foreground">
                                Across {hireCalibration.sampleSize} hired candidate(s) with employer feedback: average AI fit score{' '}
                                <strong>{hireCalibration.avgFitScore}</strong> vs. average employer rating{' '}
                                <strong>{hireCalibration.avgEmployerRating}/5</strong>.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-foreground">Recent Failed Jobs</h2>
                    {recentFailedJobs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No failed jobs recorded.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border text-left text-muted-foreground">
                                    <tr><th className="py-2 pr-4 font-medium">Queue</th><th className="py-2 pr-4 font-medium">Connection</th><th className="py-2 font-medium">Failed At</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentFailedJobs.map((job) => (
                                        <tr key={job.uuid}>
                                            <td className="py-2 pr-4 text-foreground">{job.queue}</td>
                                            <td className="py-2 pr-4 text-muted-foreground">{job.connection}</td>
                                            <td className="py-2 font-mono text-xs text-muted-foreground">{job.failed_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Response-time metrics aren't shown here — this build has no request-timing instrumentation, so that
                    number would have to be invented rather than measured.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}

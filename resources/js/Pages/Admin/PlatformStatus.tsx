import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, Cpu, ListChecks, Target } from 'lucide-react';

interface FailedJob { uuid: string; connection: string; queue: string; failed_at: string }
interface Props extends PageProps {
    queueDepth: number;
    failedJobsCount: number;
    embeddingSuccessRate: number | null;
    matchScoringSuccessRate: number | null;
    recentFailedJobs: FailedJob[];
}

export default function PlatformStatus({ queueDepth, failedJobsCount, embeddingSuccessRate, matchScoringSuccessRate, recentFailedJobs }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Platform Status" />
            <div className="space-y-6">
                <PageHeader icon={Cpu} title="Platform Status" subtitle="Queue health and AI pipeline success rates." />

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={ListChecks} color="blue" label="Queued Jobs" value={queueDepth} sub="Waiting to run" />
                    <StatTile icon={AlertTriangle} color={failedJobsCount > 0 ? 'red' : 'green'} label="Failed Jobs" value={failedJobsCount} sub="All-time" />
                    <StatTile icon={Cpu} color="violet" label="Embedding Success" value={embeddingSuccessRate !== null ? `${embeddingSuccessRate}%` : '—'} sub="Résumés & postings embedded" />
                    <StatTile icon={Target} color="amber" label="AI Scoring Success" value={matchScoringSuccessRate !== null ? `${matchScoringSuccessRate}%` : '—'} sub="Matches scored by an AI provider" />
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

import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Activity, Award, TrendingUp, Users } from 'lucide-react';

interface AggregateProps {
    mode: 'aggregate';
    totalRespondents: number;
    averageScore: number | null;
    distribution: Record<string, number>;
}
interface PersonalProps {
    mode: 'personal';
    hasResult: boolean;
    score: number | null;
    band: string | null;
    surveyTitle: string | null;
    openSurvey: { id: number; title: string } | null;
}
type Props = AggregateProps | PersonalProps;

const BAND_COLORS: Record<string, string> = {
    'Career Ready': 'text-emerald-600 dark:text-emerald-400',
    'Developing': 'text-amber-600 dark:text-amber-400',
    'Needs Improvement': 'text-red-600 dark:text-red-400',
};

function ScoreBadge({ score, band }: { score: number; band: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-5xl font-bold text-foreground">{score}%</p>
            <p className={`mt-2 text-lg font-semibold ${BAND_COLORS[band] ?? 'text-foreground'}`}>{band}</p>
        </div>
    );
}

export default function CareerReadiness(props: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Career Readiness" />
            <div className="space-y-6">
                <PageHeader
                    icon={Activity}
                    title="Career Readiness"
                    subtitle={props.mode === 'aggregate'
                        ? 'How career-ready your students are, based on submitted readiness assessments.'
                        : "Your readiness score, scored from the assessment's rating questions (1-5 scale)."}
                />

                {props.mode === 'aggregate' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <Users size={14} /> Respondents
                                </div>
                                <p className="mt-1 text-2xl font-bold text-foreground">{props.totalRespondents}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <TrendingUp size={14} /> Average Score
                                </div>
                                <p className="mt-1 text-2xl font-bold text-foreground">{props.averageScore ?? '—'}{props.averageScore !== null && '%'}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-4 font-semibold text-foreground">Readiness Distribution</h2>
                            {props.totalRespondents === 0 ? (
                                <p className="text-sm text-muted-foreground">No readiness assessments have been submitted yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(props.distribution).map(([band, count]) => (
                                        <div key={band}>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className={`font-medium ${BAND_COLORS[band]}`}>{band}</span>
                                                <span className="text-muted-foreground">{count}</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${props.totalRespondents ? (count / props.totalRespondents) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {props.mode === 'personal' && (
                    props.hasResult && props.score !== null && props.band ? (
                        <div className="space-y-4">
                            <ScoreBadge score={props.score} band={props.band} />
                            <p className="text-center text-sm text-muted-foreground">Based on: {props.surveyTitle}</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                            <Award size={32} className="mx-auto mb-3 text-muted-foreground" />
                            {props.openSurvey ? (
                                <>
                                    <p className="text-muted-foreground">Take the "{props.openSurvey.title}" assessment to see your readiness score.</p>
                                    <Link href={route('surveys.respond', props.openSurvey.id)} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">
                                        Take Assessment
                                    </Link>
                                </>
                            ) : (
                                <p className="text-muted-foreground">No career readiness assessment is open right now. Check back later.</p>
                            )}
                        </div>
                    )
                )}
            </div>
        </AuthenticatedLayout>
    );
}

import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { skillRadar } from '@/lib/demoData';
import { Head } from '@inertiajs/react';
import { Target } from 'lucide-react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';

const GAPS = skillRadar
    .map((s) => ({ ...s, gap: s.market - s.you }))
    .sort((a, b) => b.gap - a.gap);

const RESOURCES: Record<string, string> = {
    Python: 'Python for Everybody — Coursera',
    Cloud: 'AWS Cloud Practitioner Essentials',
    SQL: 'SQL for Data Analysis — Mode',
    React: 'Advanced React Patterns',
    JavaScript: 'JavaScript: The Hard Parts',
    'UI/UX': 'Google UX Design Certificate',
};

export default function SkillGap() {
    return (
        <AuthenticatedLayout>
            <Head title="Skill Gap Analysis" />
            <div className="space-y-6">
                <PageHeader
                    icon={Target}
                    title="Skill Gap Analysis"
                    subtitle="How your skills compare to current market demand, and the highest-impact areas to close the gap."
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">You vs. Market Demand</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={skillRadar}>
                                    <PolarGrid stroke="var(--border)" />
                                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                    <Radar name="You" dataKey="you" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />
                                    <Radar name="Market" dataKey="market" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.15} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Priority skills to build</h2>
                        <div className="space-y-4">
                            {GAPS.map((s) => (
                                <div key={s.skill}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground">{s.skill}</span>
                                        <span className={s.gap > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                            {s.gap > 0 ? `${s.gap} pt gap` : 'On target'}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${s.you}%` }} />
                                    </div>
                                    {s.gap > 0 && RESOURCES[s.skill] && (
                                        <p className="mt-1 text-xs text-muted-foreground">Recommended: {RESOURCES[s.skill]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

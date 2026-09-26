import StatTile from '@/Components/StatTile';
import { Stat } from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { GraduationCap, Target, TrendingUp } from 'lucide-react';
import { ChangeEvent } from 'react';
import CategoryBarChart from '@/Components/Charts/CategoryBarChart';

interface ProgramRate { dept: string; rate: number }
interface College { id: number; name: string; code: string | null }

export default function DepartmentHeadDashboard({ stats, placementByProgram, colleges }: PageProps<{ stats: Stat[]; placementByProgram: ProgramRate[]; colleges: College[] }>) {
    const { auth } = usePage<PageProps>().props;
    const byLabel = (label: string) => stats.find((s) => s.label === label)?.value ?? '—';

    function assignCollege(e: ChangeEvent<HTMLSelectElement>) {
        router.patch(route('department-head.college.update'), { department_id: e.target.value || null }, { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Department Head</h1>
                    <p className="mt-1 max-w-3xl text-muted-foreground">
                        Empirical data for continuous academic improvement and quality assurance — graduate employment,
                        program outcomes, and skill gaps to support curriculum updates and accreditation (PACUCOA, CHED, ISO).
                    </p>
                </div>

                {!auth.user.department_id && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-500/10">
                        <label className="block text-sm font-medium text-amber-900 dark:text-amber-300">
                            Assign your college so your analytics can scope to your programs
                        </label>
                        <select onChange={assignCollege} defaultValue=""
                            className="mt-2 w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-card">
                            <option value="" disabled>Select your college…</option>
                            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatTile icon={GraduationCap} color="blue" label="Graduates" value={byLabel('Graduates')} />
                    <StatTile icon={TrendingUp} color="green" label="Employment Rate" value={byLabel('Employment Rate')} />
                    <StatTile icon={Target} color="violet" label="Related Employment" value={byLabel('Related Employment')} />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-semibold text-foreground">Placement Rate by Program</h2>
                    {placementByProgram.length === 0 ? (
                        <p className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
                            No programs assigned to your department yet.
                        </p>
                    ) : (
                        <CategoryBarChart data={placementByProgram} name="Placement %" />
                    )}
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground">Reports</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('reports.employability')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Employability Report</Link>
                        <Link href={route('reports.program-outcomes')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Program Outcomes</Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

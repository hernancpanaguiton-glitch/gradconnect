import CandidateProfileModal from '@/Components/CandidateProfileModal';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, MapPin, Search, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Skill { id: number; name: string }
interface Candidate {
    id: number;
    program: string | null;
    headline: string | null;
    city: string | null;
    resumes_count: number;
    user: { name: string };
    department: { id: number; name: string } | null;
    skills: Skill[];
}
interface College { id: number; name: string }
interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
    from: number | null;
    to: number | null;
}
interface Props extends PageProps {
    candidates: Paginated<Candidate>;
    colleges: College[];
    filters: { search: string; college: number | null; with_resume: boolean };
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function TalentSearch({ candidates, colleges, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [college, setCollege] = useState(filters.college ? String(filters.college) : '');
    const [withResume, setWithResume] = useState(filters.with_resume ?? false);
    const [selected, setSelected] = useState<number | null>(null);

    function submit(e: FormEvent) {
        e.preventDefault();
        router.get(route('talent-search'), {
            search: search || undefined,
            college: college || undefined,
            with_resume: withResume || undefined,
        }, { preserveState: true, preserveScroll: true, replace: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Talent Search" />
            <div className="space-y-6">
                <PageHeader
                    icon={Users}
                    title="Talent Search"
                    subtitle="Search the UCLM graduate pool by skill, program, or name and review candidate profiles."
                />

                <form onSubmit={submit} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                        <Search size={16} className="text-muted-foreground" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by skill, program, or name…" className="flex-1 bg-transparent text-sm focus:outline-none" />
                    </div>
                    <select value={college} onChange={(e) => setCollege(e.target.value)} className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                        <option value="">All colleges</option>
                        {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={withResume} onChange={(e) => setWithResume(e.target.checked)} className="h-4 w-4 rounded border-border accent-[color:var(--primary)]" />
                        Has résumé
                    </label>
                    <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">Search</button>
                </form>

                <p className="text-sm text-muted-foreground">
                    {candidates.total} candidate{candidates.total === 1 ? '' : 's'} found
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {candidates.data.map((c) => (
                        <div key={c.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">{initials(c.user.name)}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">{c.user.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{c.headline ?? c.program ?? 'Graduate'}</p>
                                </div>
                                {c.resumes_count > 0 && (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        <FileText size={11} /> Résumé
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                {c.department && <p>{c.department.name}</p>}
                                {c.city && <p className="flex items-center gap-1"><MapPin size={12} /> {c.city}</p>}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {c.skills.slice(0, 5).map((s) => <span key={s.id} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{s.name}</span>)}
                                {c.skills.length > 5 && <span className="text-xs text-muted-foreground">+{c.skills.length - 5}</span>}
                            </div>
                            <button onClick={() => setSelected(c.id)} className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted">
                                View profile
                            </button>
                        </div>
                    ))}
                    {candidates.data.length === 0 && (
                        <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
                            No candidates match your search.
                        </div>
                    )}
                </div>

                {candidates.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {candidates.links.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url} preserveScroll
                                    className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground hover:bg-muted'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>

            {selected !== null && <CandidateProfileModal profileId={selected} onClose={() => setSelected(null)} />}
        </AuthenticatedLayout>
    );
}

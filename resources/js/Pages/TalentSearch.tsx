import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { MapPin, Search, Users } from 'lucide-react';

const CANDIDATES = [
    { name: 'Maria Santos', program: 'BS Computer Science', match: 95, city: 'Cebu City', skills: ['React', 'Node.js', 'SQL'], avatar: 'MS' },
    { name: 'James Ramos', program: 'BS Information Technology', match: 91, city: 'Mandaue City', skills: ['Python', 'Django', 'AWS'], avatar: 'JR' },
    { name: 'Ana Reyes', program: 'BS Computer Engineering', match: 88, city: 'Lapu-Lapu City', skills: ['C++', 'IoT', 'Linux'], avatar: 'AR' },
    { name: 'Leo Cruz', program: 'BS Information Systems', match: 84, city: 'Cebu City', skills: ['SQL', 'Power BI', 'Excel'], avatar: 'LC' },
];

export default function TalentSearch() {
    return (
        <AuthenticatedLayout>
            <Head title="Talent Search" />
            <div className="space-y-6">
                <PageHeader icon={Users} title="Talent Search" subtitle="Search the graduate pool and surface candidates ranked by AI fit." />

                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                        <Search size={16} className="text-muted-foreground" />
                        <input placeholder="Search by skill, program, or role…" className="flex-1 bg-transparent text-sm focus:outline-none" />
                    </div>
                    <select className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                        <option>All programs</option><option>Computer Science</option><option>Information Technology</option>
                    </select>
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-blue-700">Search</button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CANDIDATES.map((c) => (
                        <div key={c.name} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">{c.avatar}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">{c.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{c.program}</p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{c.match}%</span>
                            </div>
                            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {c.city}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {c.skills.map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{s}</span>)}
                            </div>
                            <button className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted">View profile</button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

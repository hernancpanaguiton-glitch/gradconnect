import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Layers, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Alias { id: number; alias: string }
interface SkillItem { id: number; name: string; category: string | null; aliases: Alias[] }
interface Paginated<T> { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }> }
interface Props extends PageProps { skills: Paginated<SkillItem>; filters: { search: string | null } }

function AliasForm({ skillId }: { skillId: number }) {
    const [alias, setAlias] = useState('');

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!alias.trim()) return;
        router.post(route('skill-taxonomy.aliases.store', skillId), { alias }, { preserveScroll: true, onSuccess: () => setAlias('') });
    }

    return (
        <form onSubmit={submit} className="flex gap-1.5">
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Add alias (e.g. JS)"
                className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            <button type="submit" className="rounded-lg bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/70">Add</button>
        </form>
    );
}

export default function Skills({ skills, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applySearch(e: FormEvent) {
        e.preventDefault();
        router.get(route('skill-taxonomy.index'), { search }, { preserveState: true });
    }

    function removeAlias(aliasId: number) {
        router.delete(route('skill-taxonomy.aliases.destroy', aliasId), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Skill Taxonomy" />
            <div className="space-y-6">
                <PageHeader icon={Layers} title="Skill Taxonomy" subtitle="Merge synonyms (e.g. JS, ECMAScript) into one canonical skill so matching and analytics aren't fragmented." />

                <form onSubmit={applySearch} className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 max-w-md">
                    <Search size={16} className="text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…"
                        className="flex-1 bg-transparent text-sm focus:outline-none" />
                </form>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">Skill</th><th className="px-6 py-3 font-medium">Aliases</th><th className="px-6 py-3 font-medium">Add Alias</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {skills.data.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-medium text-foreground">{s.name}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {s.aliases.map((a) => (
                                                <span key={a.id} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                                                    {a.alias}
                                                    <button onClick={() => removeAlias(a.id)} className="text-red-500 hover:text-red-700">×</button>
                                                </span>
                                            ))}
                                            {s.aliases.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3"><AliasForm skillId={s.id} /></td>
                                </tr>
                            ))}
                            {skills.data.length === 0 && (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-muted-foreground">No skills found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {skills.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {skills.links.map((link, i) => (
                            <button key={i} disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${link.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

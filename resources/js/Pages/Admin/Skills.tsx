import Pagination from '@/Components/Pagination';
import TableCard from '@/Components/TableCard';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Layers, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Alias { id: number; alias: string }
interface SkillItem { id: number; name: string; category: string | null; aliases: Alias[] }
interface Paginated<T> { data: T[]; links: Array<{ url: string | null; label: string; active: boolean }> }
interface Props extends PageProps { skills: Paginated<SkillItem>; filters: { search: string | null } }

/**
 * One form per row, so a rejected alias reports back beside the input that
 * caused it rather than into whichever row happens to render last.
 */
function AliasForm({ skillId }: { skillId: number }) {
    const { data, setData, post, processing, errors, reset } = useForm({ alias: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!data.alias.trim()) return;
        post(route('skill-taxonomy.aliases.store', skillId), {
            preserveScroll: true,
            // Keep the rejected text so the admin can correct it in place.
            onSuccess: () => reset('alias'),
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-1">
            <div className="flex gap-1.5">
                <input value={data.alias} onChange={(e) => setData('alias', e.target.value)} placeholder="Add alias (e.g. JS)"
                    className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" disabled={processing} className="rounded-lg bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/70 disabled:opacity-50">Add</button>
            </div>
            {errors.alias && <p className="max-w-48 text-xs text-destructive">{errors.alias}</p>}
        </form>
    );
}

export default function Skills({ skills, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applySearch(e: FormEvent) {
        e.preventDefault();
        router.get(route('skill-taxonomy.index'), { search }, { preserveState: true });
    }

    function removeAlias(aliasId: number, alias: string) {
        // A 10px x inside a chip, and the deletion is permanent.
        if (!confirm(`Remove the alias "${alias}"? Resumes using it will stop matching this skill.`)) {
            return;
        }

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

                <TableCard>
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
                                                    <button onClick={() => removeAlias(a.id, a.alias)} className="text-destructive hover:text-destructive">×</button>
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
                </TableCard>

                <Pagination links={skills.links} />
            </div>
        </AuthenticatedLayout>
    );
}

import axios from 'axios';
import { Briefcase, ClipboardList, Loader2, Search, UserSquare2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SearchHit {
    id: number;
    title: string;
    subtitle: string | null;
    url: string;
}

interface SearchResults {
    users: SearchHit[];
    candidates: SearchHit[];
    jobs: SearchHit[];
    surveys: SearchHit[];
}

const EMPTY: SearchResults = { users: [], candidates: [], jobs: [], surveys: [] };

const GROUPS: Array<{ key: keyof SearchResults; label: string; icon: typeof Users }> = [
    { key: 'users', label: 'Accounts', icon: Users },
    { key: 'candidates', label: 'Graduates & Alumni', icon: UserSquare2 },
    { key: 'jobs', label: 'Job Postings', icon: Briefcase },
    { key: 'surveys', label: 'Surveys', icon: ClipboardList },
];

/** Topbar global search — Table 5 "Search Bar". Debounced, permission-scoped server-side. */
export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(EMPTY);
            setLoading(false);
            return;
        }

        setLoading(true);
        const handle = setTimeout(() => {
            axios.get<SearchResults>(route('search'), { params: { q: query } })
                .then((r) => setResults(r.data))
                .catch(() => setResults(EMPTY))
                .finally(() => setLoading(false));
        }, 250);

        return () => clearTimeout(handle);
    }, [query]);

    const hasAnyResults = GROUPS.some((g) => results[g.key].length > 0);

    return (
        <div ref={containerRef} className="relative hidden max-w-sm flex-1 md:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className="w-full rounded-lg border border-transparent bg-muted py-2 pl-9 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                placeholder="Search jobs, graduates, companies…"
            />
            {loading && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}

            {open && query.trim().length >= 2 && (
                <div className="absolute left-0 top-11 z-50 w-[26rem] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    {!loading && !hasAnyResults && (
                        <p className="p-4 text-center text-sm text-muted-foreground">No results for "{query}".</p>
                    )}
                    <div className="max-h-96 overflow-y-auto">
                        {GROUPS.map(({ key, label, icon: Icon }) => {
                            const hits = results[key];
                            if (hits.length === 0) return null;
                            return (
                                <div key={key} className="border-b border-border last:border-0">
                                    <p className="px-4 pt-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                    <ul className="pb-2">
                                        {hits.map((hit) => (
                                            <li key={`${key}-${hit.id}`}>
                                                <a
                                                    href={hit.url}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    <Icon size={14} className="shrink-0 text-muted-foreground" />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate font-medium text-foreground">{hit.title}</span>
                                                        {hit.subtitle && (
                                                            <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                                                        )}
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

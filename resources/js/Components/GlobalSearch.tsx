import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useDismiss from '@/hooks/useDismiss';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import { Briefcase, ClipboardList, Loader2, Search, UserSquare2, Users, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

function ResultsList({
    results,
    loading,
    query,
    onNavigate,
}: {
    results: SearchResults;
    loading: boolean;
    query: string;
    onNavigate: () => void;
}) {
    const hasAnyResults = GROUPS.some((group) => results[group.key].length > 0);

    return (
        <>
            {!loading && !hasAnyResults && (
                <p className="p-4 text-center text-sm text-muted-foreground">No results for "{query}".</p>
            )}
            {GROUPS.map(({ key, label, icon: Icon }) => {
                const hits = results[key];

                if (hits.length === 0) {
                    return null;
                }

                return (
                    <div key={key} className="border-b border-border last:border-0">
                        <p className="px-4 pt-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                        <ul className="pb-2">
                            {hits.map((hit) => (
                                <li key={`${key}-${hit.id}`}>
                                    <Link
                                        href={hit.url}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
                                        onClick={onNavigate}
                                    >
                                        <Icon size={14} className="shrink-0 text-muted-foreground" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium text-foreground">{hit.title}</span>
                                            {hit.subtitle && (
                                                <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </>
    );
}

/**
 * Topbar global search — Table 5 "Search Bar". Debounced, permission-scoped server-side.
 *
 * The inline field needs more width than a phone's topbar has, so below `md`
 * it collapses to an icon that opens a full-width sheet. Previously the field
 * was simply hidden there, leaving no way to search on a phone at all.
 */
export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Dismissing has to clear the query too, or reopening the sheet shows the
    // previous term and its results before the user has typed anything.
    const closeSheet = useCallback(() => {
        setSheetOpen(false);
        setQuery('');
    }, []);

    const containerRef = useDismiss<HTMLDivElement>(open, () => setOpen(false));
    const sheetRef = useDismiss<HTMLDivElement>(sheetOpen, closeSheet);

    useBodyScrollLock(sheetOpen);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults(EMPTY);
            setLoading(false);
            return;
        }

        setLoading(true);
        const controller = new AbortController();
        const handle = setTimeout(() => {
            axios.get<SearchResults>(route('search'), { params: { q: query }, signal: controller.signal })
                .then((r) => { if (!controller.signal.aborted) setResults(r.data); })
                .catch(() => { if (!controller.signal.aborted) setResults(EMPTY); })
                .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        }, 250);

        // Search fans out over several LIKE queries, so response order does not
        // follow keystroke order — only the latest query may write results.
        return () => { clearTimeout(handle); controller.abort(); };
    }, [query]);

    const showResults = query.trim().length >= 2;

    return (
        <>
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

                {open && showResults && (
                    <div className="absolute left-0 top-11 z-50 w-[26rem] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                        <div className="max-h-96 overflow-y-auto">
                            <ResultsList results={results} loading={loading} query={query} onNavigate={() => setOpen(false)} />
                        </div>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="Search"
                className="tap-target rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden"
            >
                <Search size={18} />
            </button>

            {sheetOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden">
                    <div ref={sheetRef} className="border-b border-border bg-card p-2 shadow-xl">
                        <div className="flex items-center gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full rounded-lg border border-transparent bg-muted py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    placeholder="Search jobs, graduates…"
                                />
                                {loading && (
                                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={closeSheet}
                                aria-label="Close search"
                                className="tap-target rounded-lg text-muted-foreground hover:bg-muted"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {showResults && (
                            <div className="mt-2 max-h-[70dvh] overflow-y-auto rounded-xl border border-border">
                                <ResultsList results={results} loading={loading} query={query} onNavigate={closeSheet} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

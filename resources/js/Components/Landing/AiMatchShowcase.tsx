import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { MatchShowcaseItem } from '@/types';
import { Brain, Building2, MapPin, Pause, Play, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

const ROTATE_MS = 5000;

/** "₱28K–45K/mo" — the shorthand Cebu job ads actually use. */
function salaryRange(min: number, max: number): string {
    return `₱${Math.round(min / 1000)}K–${Math.round(max / 1000)}K/mo`;
}

/**
 * The hero's AI match example, one per college.
 *
 * The old card was a single hard-coded full-stack developer hidden behind
 * `hidden md:block`, so most visitors — on a phone, and from nine other
 * colleges — never saw a match that looked like theirs.
 */
export default function AiMatchShowcase({ items }: { items: MatchShowcaseItem[] }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [interacting, setInteracting] = useState(false);
    const [tabHidden, setTabHidden] = useState(false);
    const [barsIn, setBarsIn] = useState(false);
    const prefersReducedMotion = usePrefersReducedMotion();

    const rotating = items.length > 1 && !paused && !interacting && !tabHidden && !prefersReducedMotion;

    // A background tab still fires intervals, which would burn through every
    // college before the visitor came back.
    useEffect(() => {
        const onVisibilityChange = () => setTabHidden(document.hidden);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    useEffect(() => {
        if (!rotating) {
            return;
        }

        const handle = setInterval(() => setIndex((current) => (current + 1) % items.length), ROTATE_MS);

        return () => clearInterval(handle);
    }, [rotating, items.length]);

    // Re-run the bar growth on every change by dropping back to zero width
    // for one frame.
    useEffect(() => {
        setBarsIn(false);
        const handle = requestAnimationFrame(() => setBarsIn(true));

        return () => cancelAnimationFrame(handle);
    }, [index]);

    if (items.length === 0) {
        return null;
    }

    const item = items[index] ?? items[0];
    const animate = !prefersReducedMotion;

    return (
        <div
            className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-6"
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => setInteracting(false)}
            onFocusCapture={() => setInteracting(true)}
            onBlurCapture={() => setInteracting(false)}
        >
            {/* College chips — scrollable on a phone, full name on hover. */}
            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                {items.map((option, optionIndex) => (
                    <button
                        key={option.college_code}
                        type="button"
                        title={option.college_name}
                        aria-pressed={optionIndex === index}
                        onClick={() => {
                            setIndex(optionIndex);
                            setPaused(true);
                        }}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            optionIndex === index
                                ? 'bg-white text-[#0f1f3d]'
                                : 'bg-white/10 text-blue-100 hover:bg-white/20'
                        }`}
                    >
                        {option.short_label}
                    </button>
                ))}
            </div>

            {/* Announce changes only when the visitor is driving them; an
                auto-rotating region would otherwise interrupt constantly. */}
            <div aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500">
                        <Brain size={20} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">AI Job Match Found</p>
                        <p className="truncate text-xs text-blue-200">{item.job_title}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {item.match}% Match
                    </span>
                </div>

                <div className="mb-4 space-y-3">
                    {item.skills.map((skill) => (
                        <div key={skill.name}>
                            <div className="mb-1 flex justify-between gap-2 text-xs text-blue-100">
                                <span className="truncate">{skill.name}</span>
                                <span className="shrink-0">{skill.match}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10">
                                <div
                                    className={`h-1.5 rounded-full bg-blue-400 ${animate ? 'transition-all duration-700 ease-out' : ''}`}
                                    style={{ width: `${animate && !barsIn ? 0 : skill.match}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-blue-200">
                    <span className="flex items-center gap-1">
                        <Building2 size={12} /> {item.employer_type}
                    </span>
                    <span className="flex items-center gap-1">
                        <Wallet size={12} /> {salaryRange(item.salary_min, item.salary_max)}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin size={12} /> {item.location}
                    </span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-blue-300/80">Illustrative example, not a live posting.</p>
                {items.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setPaused((current) => !current)}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100 transition-colors hover:bg-white/20"
                    >
                        {paused ? <Play size={11} /> : <Pause size={11} />}
                        {paused ? 'Play' : 'Pause'}
                    </button>
                )}
            </div>
        </div>
    );
}

import { useMemo, useState } from 'react';

export interface PickerSkill {
    id: number;
    name: string;
    category: string | null;
}

interface Props {
    skills: PickerSkill[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    /** The viewer's own college category, opened first. */
    openCategory?: string | null;
}

/** Always open: everyone draws on these, whatever they studied. */
const ALWAYS_OPEN = 'Soft Skills';

const UNCATEGORISED = 'Other';

/**
 * Collapsible, filterable skill picker.
 *
 * The catalogue is ~230 skills across ten colleges, so the old flat wall of
 * chips meant a nursing graduate scrolled past every framework in computer
 * studies to reach "Wound Care". Categories start collapsed except the ones
 * the viewer plausibly needs: their own college's, the shared soft skills,
 * and anything they have already picked.
 */
export default function SkillCategoryPicker({ skills, selectedIds, onToggle, openCategory }: Props) {
    const [query, setQuery] = useState('');
    const [toggled, setToggled] = useState<Record<string, boolean>>({});

    const term = query.trim().toLowerCase();

    const categories = useMemo(() => {
        const grouped = skills.reduce<Record<string, PickerSkill[]>>((accumulator, skill) => {
            const category = skill.category ?? UNCATEGORISED;
            accumulator[category] = [...(accumulator[category] ?? []), skill];

            return accumulator;
        }, {});

        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [skills]);

    const matching = (categorySkills: PickerSkill[]) =>
        term === '' ? categorySkills : categorySkills.filter((skill) => skill.name.toLowerCase().includes(term));

    function isOpen(category: string, categorySkills: PickerSkill[]): boolean {
        // While filtering, every group with a hit is open — a match hidden
        // inside a collapsed group reads as "no results".
        if (term !== '') {
            return true;
        }

        if (toggled[category] !== undefined) {
            return toggled[category];
        }

        return (
            category === openCategory ||
            category === ALWAYS_OPEN ||
            categorySkills.some((skill) => selectedIds.includes(skill.id))
        );
    }

    const visible = categories
        .map(([category, categorySkills]) => [category, categorySkills, matching(categorySkills)] as const)
        .filter(([, , matches]) => matches.length > 0);

    return (
        <div className="space-y-2">
            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter skills…"
                aria-label="Filter skills"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {visible.map(([category, categorySkills, matches]) => {
                const selectedCount = categorySkills.filter((skill) => selectedIds.includes(skill.id)).length;

                return (
                    <details
                        // `open` is a DOM property the browser also writes to, so
                        // React can believe a group is open while the user has
                        // collapsed it. Remounting when the filter goes on or off
                        // makes the markup authoritative again at that moment.
                        key={`${category}:${term === '' ? 'browse' : 'filter'}`}
                        open={isOpen(category, categorySkills)}
                        onToggle={(event) => {
                            // Read `open` now: React clears currentTarget once the
                            // handler returns, and a state updater runs later — so
                            // reaching for it in there throws and unmounts the page.
                            const open = event.currentTarget.open;

                            // While filtering, every group is forced open; recording
                            // that would leave them all open after the filter clears.
                            if (term === '') {
                                setToggled((current) => ({ ...current, [category]: open }));
                            }
                        }}
                        className="rounded-lg border border-gray-200"
                    >
                        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {category}
                            <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
                                {selectedCount > 0 ? `${selectedCount} selected · ` : ''}
                                {matches.length} skill{matches.length === 1 ? '' : 's'}
                            </span>
                        </summary>
                        <div className="flex flex-wrap gap-2 border-t border-gray-100 p-3">
                            {matches.map((skill) => {
                                const selected = selectedIds.includes(skill.id);

                                return (
                                    <button
                                        key={skill.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => onToggle(skill.id)}
                                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                                            selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {skill.name}
                                    </button>
                                );
                            })}
                        </div>
                    </details>
                );
            })}

            {visible.length === 0 && (
                <p className="px-1 py-6 text-center text-sm text-gray-400">No skills match "{query.trim()}".</p>
            )}
        </div>
    );
}

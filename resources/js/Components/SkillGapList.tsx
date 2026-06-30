interface Props {
    matchedSkills: string[] | null;
    skillGaps: string[] | null;
}

export default function SkillGapList({ matchedSkills, skillGaps }: Props) {
    const matched = matchedSkills ?? [];
    const gaps = skillGaps ?? [];

    if (matched.length === 0 && gaps.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {matched.map((skill) => (
                <span key={`m-${skill}`} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 ring-1 ring-green-200">
                    ✓ {skill}
                </span>
            ))}
            {gaps.map((skill) => (
                <span key={`g-${skill}`} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
                    + {skill}
                </span>
            ))}
        </div>
    );
}

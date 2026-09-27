interface Props {
    fitScore: number | null;
    similarity: number | null;
    recommendation: string | null;
}

/**
 * A width the browser will accept.
 *
 * An out-of-range value produces a declaration like `width: -38%`, which the
 * browser discards — leaving the block at `width: auto`, i.e. the full track.
 * The weakest candidate on the page then drew the fullest bar. Cosine
 * similarity spans [-1,1] and fit_score comes from model JSON with no range
 * rule, so neither input can be trusted.
 */
function barWidth(value: number): string {
    return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
}

const recommendationColors: Record<string, string> = {
    strong: 'bg-green-500',
    moderate: 'bg-yellow-500',
    weak: 'bg-red-500',
};

export default function FitScoreBar({ fitScore, similarity, recommendation }: Props) {
    if (fitScore === null) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                        className="h-2 rounded-full bg-gray-400"
                        style={{ width: barWidth((similarity ?? 0) * 100) }}
                    />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                    {similarity !== null ? `${Math.round(similarity * 100)}% similar` : 'Not scored'}
                </span>
            </div>
        );
    }

    const barColor = recommendationColors[recommendation ?? ''] ?? 'bg-indigo-500';

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-muted">
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: barWidth(fitScore) }} />
            </div>
            <span className="shrink-0 text-xs font-medium text-foreground">{fitScore}% fit</span>
        </div>
    );
}

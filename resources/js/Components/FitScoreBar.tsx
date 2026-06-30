interface Props {
    fitScore: number | null;
    similarity: number | null;
    recommendation: string | null;
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
                <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                        className="h-2 rounded-full bg-gray-400"
                        style={{ width: `${Math.round((similarity ?? 0) * 100)}%` }}
                    />
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                    {similarity !== null ? `${Math.round(similarity * 100)}% similar` : 'Not scored'}
                </span>
            </div>
        );
    }

    const barColor = recommendationColors[recommendation ?? ''] ?? 'bg-indigo-500';

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${fitScore}%` }} />
            </div>
            <span className="shrink-0 text-xs font-medium text-gray-700">{fitScore}% fit</span>
        </div>
    );
}

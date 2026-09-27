export interface Stat {
    label: string;
    value: string | number;
    sub?: string;
}

export default function StatCard({ label, value, sub }: Stat) {
    return (
        <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

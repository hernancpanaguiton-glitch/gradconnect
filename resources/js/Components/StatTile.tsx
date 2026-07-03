import { LucideIcon } from 'lucide-react';

type Color = 'blue' | 'green' | 'amber' | 'violet' | 'sky' | 'red';

const CHIP: Record<Color, string> = {
    blue: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

export default function StatTile({
    icon: Icon,
    label,
    value,
    change,
    sub,
    color = 'blue',
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: string;
    sub?: string;
    color?: Color;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
                    {change && (
                        <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">↑ {change}</p>
                    )}
                    {sub && !change && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${CHIP[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

import { useIsDesktop } from '@/hooks/useMediaQuery';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const TOOLTIP_STYLE = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--foreground)',
    fontSize: 12,
};

/**
 * A percentage bar chart keyed by a long category name (a degree program).
 *
 * Program names are far too long to sit side by side on a phone's x-axis —
 * they overlap into an unreadable smear — so the bars run horizontally and
 * the names get their own column, truncated to fit with the full name in
 * the tooltip. Height grows with the row count so bars stay tappable.
 */
export default function CategoryBarChart({
    data,
    categoryKey = 'dept',
    valueKey = 'rate',
    name,
    color = 'var(--primary)',
}: {
    data: ReadonlyArray<object>;
    categoryKey?: string;
    valueKey?: string;
    name: string;
    color?: string;
}) {
    const isDesktop = useIsDesktop();
    const labelWidth = isDesktop ? 180 : 110;
    const maxLabel = isDesktop ? 26 : 16;

    const height = Math.max(240, data.length * 36 + 32);

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey={categoryKey}
                        width={labelWidth}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: string) =>
                            value.length > maxLabel ? `${value.slice(0, maxLabel - 1)}…` : value
                        }
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey={valueKey} name={name} fill={color} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

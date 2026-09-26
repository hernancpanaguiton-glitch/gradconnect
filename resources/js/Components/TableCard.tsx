import { ReactNode } from 'react';

/**
 * Card wrapper for a data table.
 *
 * The card keeps `overflow-hidden` so its rounded corners clip the header
 * row, but the table itself sits in a separate scroller. Without that split
 * the right-hand columns — which are almost always the action buttons — are
 * clipped away on a phone with no way to reach them.
 */
export default function TableCard({
    children,
    wide = false,
    className = '',
}: {
    children: ReactNode;
    /** For tables with many columns, which need more room before wrapping. */
    wide?: boolean;
    className?: string;
}) {
    return (
        <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
            <div className={`overflow-x-auto ${wide ? '[&>table]:min-w-[56rem]' : '[&>table]:min-w-[40rem]'}`}>
                {children}
            </div>
        </div>
    );
}

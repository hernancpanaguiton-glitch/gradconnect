import { Link } from '@inertiajs/react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/**
 * Laravel pagination links.
 *
 * Wraps rather than overflowing, and every target is a 40px tap area — the
 * hand-rolled copies this replaces were a single non-wrapping row of small
 * text links.
 */
export default function Pagination({
    links,
    className = '',
}: {
    links: PaginationLink[];
    className?: string;
}) {
    // Laravel always returns Previous/Next, so anything shorter is one page.
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav aria-label="Pagination" className={`flex flex-wrap items-center gap-1 ${className}`}>
            {links.map((link, index) => {
                const classes = `inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm transition-colors ${
                    link.active
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`;

                if (!link.url) {
                    return (
                        <span
                            key={index}
                            aria-disabled="true"
                            className={`${classes} opacity-40`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        aria-current={link.active ? 'page' : undefined}
                        className={classes}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

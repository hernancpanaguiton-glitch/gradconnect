import { Link } from '@inertiajs/react';
import { ArrowLeft, LucideIcon } from 'lucide-react';

export default function PageHeader({
    icon: Icon,
    title,
    subtitle,
    action,
    back,
}: {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    /** Optional "back to …" link shown above the title. */
    back?: { href: string; label: string };
}) {
    return (
        <div>
            {back && (
                <Link
                    href={back.href}
                    className="mb-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft size={15} /> {back.label}
                </Link>
            )}
            <div className="flex flex-wrap items-start justify-between gap-4">
                {/* min-w-0 lets a long title wrap instead of widening the row. */}
                <div className="flex min-w-0 items-start gap-3">
                    {Icon && (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-500/15">
                            <Icon size={22} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="break-words text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
                        {subtitle && <p className="mt-1 max-w-3xl text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {action && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{action}</div>}
            </div>
        </div>
    );
}

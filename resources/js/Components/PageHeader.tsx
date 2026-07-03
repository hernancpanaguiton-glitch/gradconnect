import { LucideIcon } from 'lucide-react';

export default function PageHeader({
    icon: Icon,
    title,
    subtitle,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-500/15">
                        <Icon size={22} />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                    {subtitle && <p className="mt-1 max-w-3xl text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );
}

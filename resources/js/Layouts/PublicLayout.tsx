import PublicFooter from '@/Components/PublicFooter';
import PublicNav from '@/Components/PublicNav';
import { ReactNode } from 'react';

interface LayoutUser {
    id: number;
}

/**
 * Shell for the signed-out pages (landing, about, privacy), which each used
 * to carry their own copy of the top bar and footer.
 */
export default function PublicLayout({
    user,
    children,
    footer = true,
}: {
    user?: LayoutUser | null;
    children: ReactNode;
    footer?: boolean;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <PublicNav user={user} />
            {children}
            {footer && <PublicFooter />}
        </div>
    );
}

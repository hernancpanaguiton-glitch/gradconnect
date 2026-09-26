import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useDismiss from '@/hooks/useDismiss';
import { Link } from '@inertiajs/react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavUser {
    id: number;
}

const LINKS: Array<{ label: string; href: string }> = [
    { label: 'Features', href: '/#features' },
    { label: 'For Employers', href: '/register?role=industry_partner' },
    { label: 'Contact', href: '/#contact' },
    { label: 'About', href: '/about' },
];

/**
 * Top bar for the signed-out pages.
 *
 * Previously each public page carried its own copy of this markup, with the
 * links hidden below `md` and nothing to replace them, so a phone had no way
 * to reach About or the employer sign-up. The Sign In / Get Started pair also
 * needs more width than a 375px screen has, so below `sm` it moves into the
 * menu rather than wrapping inside a fixed-height bar.
 */
export default function PublicNav({ user }: { user?: NavUser | null }) {
    const [open, setOpen] = useState(false);
    const panelRef = useDismiss<HTMLElement>(open, () => setOpen(false));

    useBodyScrollLock(open);

    const signedIn = Boolean(user);

    return (
        <nav ref={panelRef} className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                <Link href="/" className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700">
                        <GraduationCap size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <span className="block truncate text-lg font-bold leading-tight text-foreground">GradConnect</span>
                        <span className="block truncate text-xs leading-none text-muted-foreground">UCLM Career Platform</span>
                    </div>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    {LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {signedIn ? (
                        <Link
                            href={route('dashboard')}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="hidden items-center gap-2 sm:flex">
                            <Link
                                href={route('login')}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-50"
                            >
                                Sign In
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-controls="public-mobile-menu"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        className="tap-target rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {open && (
                <div id="public-mobile-menu" className="border-t border-border bg-white px-4 py-3 md:hidden">
                    <div className="flex flex-col">
                        {LINKS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {!signedIn && (
                        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:hidden">
                            <Link
                                href={route('login')}
                                onClick={() => setOpen(false)}
                                className="flex min-h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-primary transition-colors hover:bg-blue-50"
                            >
                                Sign In
                            </Link>
                            <Link
                                href={route('register')}
                                onClick={() => setOpen(false)}
                                className="flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}

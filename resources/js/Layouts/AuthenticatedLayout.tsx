import GlobalSearch from '@/Components/GlobalSearch';
import ThemeToggle from '@/Components/ThemeToggle';
import { getNavFor, NavSection, ROLE_LABELS } from '@/lib/nav';
import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    GraduationCap,
    LogOut,
    Menu,
    Settings,
    User as UserIcon,
    X,
} from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const s = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm';
    return (
        <div className={`${s} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 font-bold text-white`}>
            {initials}
        </div>
    );
}

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
    const { auth, notifications } = usePage<PageProps>().props;
    const user = auth.user;
    const unread = notifications?.unread ?? 0;
    const notifItems = notifications?.items ?? [];
    const navSections: NavSection[] = getNavFor(user);
    const currentPath = usePage().url.split('?')[0];
    const primaryRole = user.roles[0] ?? '';
    const roleLabel = ROLE_LABELS[primaryRole] ?? 'Member';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    function isActive(href: string) {
        if (href === '#') return false;
        return href === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(href);
    }

    function handleLogout() {
        router.post(route('logout'));
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-slate-950/60 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar text-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-16' : 'w-64'}`}
            >
                {/* Logo + collapse */}
                <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500">
                                <GraduationCap size={16} className="text-white" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold leading-tight text-white">GradConnect</span>
                                <span className="block truncate text-xs text-indigo-300">UCLM</span>
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 lg:flex"
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <Menu size={16} /> : <X size={16} />}
                    </button>
                    <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)}>
                        <X size={16} />
                    </button>
                </div>

                {/* Role label */}
                {!collapsed && (
                    <div className="border-b border-white/10 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">{roleLabel}</p>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
                    {navSections.map((section, i) => (
                        <div key={i}>
                            {section.title && !collapsed && (
                                <p className="mb-1 px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-white/40">{section.title}</p>
                            )}
                            <ul className="space-y-0.5">
                                {section.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.href + item.label}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? 'bg-primary text-white shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                <item.icon size={18} className="shrink-0" />
                                                {!collapsed && (
                                                    <>
                                                        <span className="flex-1 truncate text-left">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{item.badge}</span>
                                                        )}
                                                    </>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Help card */}
                {!collapsed && (
                    <div className="border-t border-white/10 p-4">
                        <div className="rounded-xl bg-indigo-600/20 p-3">
                            <p className="mb-1 text-xs font-semibold text-white">Need help?</p>
                            <p className="text-xs leading-snug text-indigo-200">Contact the Career Services team for guidance.</p>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Topbar */}
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-4 shadow-sm sm:px-6">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                        <Menu size={18} />
                    </button>

                    {/* Search */}
                    <GlobalSearch />

                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                                aria-label="Notifications"
                            >
                                <Bell size={18} />
                                {unread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                                    <div className="flex items-center justify-between border-b border-border p-4">
                                        <span className="text-sm font-semibold text-foreground">Notifications</span>
                                        {unread > 0 && (
                                            <button
                                                onClick={() => router.patch(route('notifications.read-all'), {}, { preserveScroll: true, onSuccess: () => setNotifOpen(false) })}
                                                className="text-xs font-semibold text-primary hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifItems.length === 0 && (
                                            <p className="p-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>
                                        )}
                                        {notifItems.map((n) => (
                                            <Link
                                                key={n.id}
                                                href={n.url ?? route('notifications')}
                                                onClick={() => setNotifOpen(false)}
                                                className={`block cursor-pointer border-b border-border p-4 last:border-0 hover:bg-muted/50 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <p className="text-sm font-medium leading-snug text-foreground">{n.title}</p>
                                                <p className="text-sm leading-snug text-muted-foreground">{n.message}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link href={route('notifications')} onClick={() => setNotifOpen(false)} className="block border-t border-border p-3 text-center text-sm font-semibold text-primary hover:bg-muted/50">
                                        View all notifications
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Profile menu */}
                        <div className="relative">
                            <button
                                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                                className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-muted"
                            >
                                <Avatar name={user.name} size="sm" />
                                <span className="hidden text-left sm:block">
                                    <span className="block text-sm font-semibold leading-tight text-foreground">{user.name}</span>
                                    <span className="block text-xs text-muted-foreground">{roleLabel}</span>
                                </span>
                                <ChevronDown size={14} className="text-muted-foreground" />
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-border bg-card py-2 shadow-xl">
                                    <Link href={route('profile.edit')} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                                        <UserIcon size={15} /> My Profile
                                    </Link>
                                    <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                                        <Settings size={15} /> Settings
                                    </Link>
                                    <div className="my-1 border-t border-border" />
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <FlashMessages />

                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}

function FlashMessages() {
    const { flash } = usePage<PageProps>().props;
    if (!flash?.success && !flash?.error) return null;
    return (
        <div className="px-4 pt-4 sm:px-6">
            {flash.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {flash.error}
                </div>
            )}
        </div>
    );
}

import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { getNavFor, NavItem, NavSection } from '@/lib/nav';
import { PageProps } from '@/types';

function NavIcon({ path, className = 'h-5 w-5' }: { path: string; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

function SidebarNavItem({
    item,
    collapsed,
    currentPath,
}: {
    item: NavItem;
    collapsed: boolean;
    currentPath: string;
}) {
    const isActive = item.href !== '#' && (
        item.href === '/dashboard'
            ? currentPath === '/dashboard'
            : currentPath.startsWith(item.href)
    );

    return (
        <Link
            href={item.href}
            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : undefined}
        >
            <NavIcon path={item.iconPath} className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
    );
}

function RoleBadge({ role }: { role: string }) {
    const labels: Record<string, string> = {
        admin: 'Admin',
        alumni_affairs: 'Alumni Affairs',
        department_head: 'Dept. Head',
        industry_partner: 'Industry Partner',
        alumni: 'Alumni',
        student: 'Student',
    };

    const colors: Record<string, string> = {
        admin: 'bg-red-500/20 text-red-300',
        alumni_affairs: 'bg-purple-500/20 text-purple-300',
        department_head: 'bg-blue-500/20 text-blue-300',
        industry_partner: 'bg-emerald-500/20 text-emerald-300',
        alumni: 'bg-amber-500/20 text-amber-300',
        student: 'bg-sky-500/20 text-sky-300',
    };

    return (
        <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] ?? 'bg-slate-500/20 text-slate-300'}`}
        >
            {labels[role] ?? role}
        </span>
    );
}

export default function AuthenticatedLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const navSections: NavSection[] = getNavFor(user);
    const currentPath = usePage().url.split('?')[0];

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const primaryRole = user.roles[0] ?? '';

    function handleLogout() {
        router.post(route('logout'));
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-900/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out
                    lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${collapsed ? 'w-16' : 'w-64'}
                `}
            >
                {/* Logo + collapse toggle */}
                <div className={`flex h-16 items-center border-b border-slate-700 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-white font-bold text-lg tracking-tight">GradConnect</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="hidden lg:flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            {collapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Nav sections */}
                <nav className="flex-1 overflow-y-auto py-4 space-y-6 px-2">
                    {navSections.map((section, sectionIdx) => (
                        <div key={sectionIdx}>
                            {section.title && !collapsed && (
                                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {section.title}
                                </p>
                            )}
                            <ul className="space-y-1">
                                {section.items.map((item) => (
                                    <li key={item.href + item.label}>
                                        <SidebarNavItem
                                            item={item}
                                            collapsed={collapsed}
                                            currentPath={currentPath}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User section */}
                <div className={`border-t border-slate-700 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold">
                                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                                <RoleBadge role={primaryRole} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold" title={user.name}>
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="mt-3 flex gap-2">
                            <Link
                                href={route('profile.edit')}
                                className="flex-1 text-center rounded-md py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex-1 rounded-md py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    {/* Breadcrumb / page title slot — filled by children via context if needed */}
                    <div className="flex-1" />

                    {/* Flash messages */}
                    <FlashMessages />

                    {/* User avatar + quick logout */}
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-gray-600 sm:block">{user.name}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

function FlashMessages() {
    const { flash } = usePage<PageProps>().props;

    if (!flash?.success && !flash?.error) return null;

    return (
        <>
            {flash.success && (
                <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
                    {flash.error}
                </div>
            )}
        </>
    );
}

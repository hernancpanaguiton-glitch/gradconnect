import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

/**
 * Footer for the signed-out pages.
 *
 * Every entry is a real destination: the old footer rendered plain spans
 * styled as links, so a visitor tapping "Browse Jobs" or an email address
 * got nothing back. Anything behind the sign-in wall points at the login
 * page, and the contact details are mailto:/tel: links.
 */
export default function PublicFooter() {
    const columns: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
        {
            title: 'Platform',
            links: [
                { label: 'Features', href: '/#features' },
                { label: 'AI Matching', href: '/#features' },
                { label: 'Tracer Study', href: '/#features' },
                { label: 'Career Analytics', href: '/#features' },
            ],
        },
        {
            title: 'For Students',
            links: [
                { label: 'Register', href: '/register' },
                { label: 'Upload Resume', href: '/login' },
                { label: 'Browse Jobs', href: '/login' },
                { label: 'Skill Analysis', href: '/login' },
            ],
        },
    ];

    return (
        <footer id="contact" className="scroll-mt-20 bg-[#0f1f3d] py-12 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <GraduationCap size={20} className="text-blue-400" />
                            <span className="text-lg font-bold">GradConnect</span>
                        </div>
                        <p className="text-sm leading-relaxed text-blue-200">
                            University of Cebu Lapu-Lapu and Mandaue official graduate employability platform.
                        </p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <p className="mb-3 text-sm font-semibold">{column.title}</p>
                            {column.links.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="flex min-h-9 items-center text-sm text-blue-200 transition-colors hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    ))}

                    <div>
                        <p className="mb-3 text-sm font-semibold">Contact</p>
                        <a
                            href="mailto:careers@uclm.edu.ph"
                            className="flex min-h-9 items-center break-all text-sm text-blue-200 transition-colors hover:text-white"
                        >
                            careers@uclm.edu.ph
                        </a>
                        <a
                            href="tel:+63322345678"
                            className="flex min-h-9 items-center text-sm text-blue-200 transition-colors hover:text-white"
                        >
                            +63 32 234 5678
                        </a>
                        <p className="mt-2 text-sm text-blue-200">A.C. Cortes Ave., Mandaue City</p>
                        <p className="text-sm text-blue-200">Mon–Fri 8AM–5PM</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
                    <p className="text-center text-sm text-blue-300 md:text-left">
                        © {new Date().getFullYear()} University of Cebu Lapu-Lapu and Mandaue. All rights reserved.
                    </p>
                    <Link href={route('privacy')} className="text-sm text-blue-300 transition-colors hover:text-white">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}

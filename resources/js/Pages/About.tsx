import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Brain, GraduationCap, Target, TrendingUp } from 'lucide-react';

const PILLARS = [
    {
        icon: Brain,
        title: 'AI-Powered Matching',
        desc: "GradConnect reads a graduate's résumé and profile, compares it against live job postings using vector similarity and an LLM-based recruiter model, and returns a ranked, explained compatibility score — not just a keyword match.",
    },
    {
        icon: Target,
        title: 'Skill Gap Awareness',
        desc: 'Every match highlights the skills a graduate already has and the ones a role still asks for, so career planning is based on evidence instead of guesswork.',
    },
    {
        icon: TrendingUp,
        title: 'Institutional Insight',
        desc: 'Tracer surveys, employment records, and employer feedback feed reporting for the Alumni Affairs Office, Student Affairs Office, Department Heads, and Admin — replacing spreadsheets with one shared source of truth.',
    },
];

export default function About({ auth }: PageProps) {
    return (
        <>
            <Head title="About — GradConnect" />
            <div className="min-h-screen bg-white text-foreground">
                <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700">
                                <GraduationCap size={18} className="text-white" />
                            </div>
                            <div>
                                <span className="block text-lg font-bold leading-tight text-foreground">GradConnect</span>
                                <span className="block text-xs leading-none text-muted-foreground">UCLM Career Platform</span>
                            </div>
                        </Link>
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-lg px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-50">Sign In</Link>
                                    <Link href={route('register')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-blue-700">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <section className="bg-gradient-to-br from-[#0f1f3d] via-[#1a3a6b] to-[#1a56db] py-20 text-white">
                    <div className="mx-auto max-w-4xl px-6">
                        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white">
                            <ArrowLeft size={14} /> Back to home
                        </Link>
                        <h1 className="mb-4 text-4xl font-bold">About GradConnect</h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-blue-100">
                            GradConnect is the University of Cebu Lapu-Lapu and Mandaue's Graduate Employability and
                            Career Development Platform — built to replace scattered spreadsheets and manual tracer
                            forms with one system that supports graduates, alumni, industry partners, and university
                            offices from a single, centralized database.
                        </p>
                    </div>
                </section>

                <section className="bg-[#f0f4f9] py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            {PILLARS.map((p) => (
                                <div key={p.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                        <p.icon size={22} className="text-primary" />
                                    </div>
                                    <h3 className="mb-2 font-bold text-foreground">{p.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">Who it's for</h2>
                        <div className="grid gap-4 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
                            <p><strong className="text-foreground">Graduate Students &amp; Alumni</strong> — build a career profile, upload or build a résumé, get AI-ranked job recommendations, and answer tracer surveys.</p>
                            <p><strong className="text-foreground">Industry Partners</strong> — post vacancies, search the graduate directory, and review AI compatibility scores against real applicants.</p>
                            <p><strong className="text-foreground">Alumni Affairs &amp; Student Affairs Offices</strong> — manage records, run tracer studies, and monitor engagement from one dashboard.</p>
                            <p><strong className="text-foreground">Department Heads &amp; Admin</strong> — track employment outcomes, skill gaps, and system-wide activity to support curriculum and accreditation decisions.</p>
                        </div>
                    </div>
                </section>

                <footer className="bg-[#0f1f3d] py-8 text-center text-sm text-blue-300">
                    <p>© {new Date().getFullYear()} University of Cebu Lapu-Lapu and Mandaue. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}

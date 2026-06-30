import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

function Logo({ className = 'h-8 w-8' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
            />
        </svg>
    );
}

function FeatureCard({ iconPath, title, children }: { iconPath: string; title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md hover:ring-indigo-200">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{children}</p>
        </div>
    );
}

export default function Welcome({ auth }: PageProps) {
    const icons = {
        spark: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
        clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
        chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
        building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    };

    return (
        <>
            <Head title="Welcome to GradConnect" />

            <div className="min-h-screen bg-gray-50 text-gray-900">
                {/* Top nav */}
                <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Logo className="h-7 w-7" />
                            <span className="text-lg font-bold tracking-tight text-gray-900">GradConnect</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden bg-slate-900">
                    <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />
                    <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 ring-1 ring-white/15">
                                University of Cebu — Lapu-Lapu &amp; Mandaue
                            </span>
                            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                                Connect graduates to the careers they trained for.
                            </h1>
                            <p className="mt-5 text-lg leading-relaxed text-slate-300">
                                GradConnect is the graduate employability &amp; career development platform that uses AI to
                                match résumés to job openings, surface skill gaps, run employability surveys, and track
                                career outcomes — all in one place.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                    >
                                        Open your dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                        >
                                            Create an account
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15"
                                        >
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            Everything your graduate community needs
                        </h2>
                        <p className="mt-3 text-gray-600">
                            From AI-powered job matching to accreditation-ready analytics.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard iconPath={icons.spark} title="AI Job Matching">
                            Résumés and job posts are embedded and ranked by fit, with explanations and skill-gap
                            insights for every match.
                        </FeatureCard>
                        <FeatureCard iconPath={icons.clipboard} title="Employability Surveys">
                            Run tracer studies and employability surveys, then collect structured responses from alumni
                            and graduating students.
                        </FeatureCard>
                        <FeatureCard iconPath={icons.chart} title="Outcomes &amp; Analytics">
                            Track employment status and program outcomes with reports built for department heads and
                            accreditation.
                        </FeatureCard>
                        <FeatureCard iconPath={icons.building} title="Industry Connections">
                            Partner companies post openings, review ranked candidates, and share employer competency
                            feedback.
                        </FeatureCard>
                    </div>
                </section>

                {/* CTA strip */}
                {!auth.user && (
                    <section className="mx-auto max-w-6xl px-6 pb-20">
                        <div className="rounded-2xl bg-indigo-600 px-8 py-10 text-center sm:py-12">
                            <h2 className="text-2xl font-bold text-white">Ready to get connected?</h2>
                            <p className="mx-auto mt-2 max-w-xl text-indigo-100">
                                Build your profile, upload your résumé, and start seeing roles matched to your skills.
                            </p>
                            <Link
                                href={route('register')}
                                className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            >
                                Create your account
                            </Link>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Logo className="h-5 w-5" />
                            <span className="text-sm font-medium">GradConnect</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} University of Cebu — Lapu-Lapu &amp; Mandaue
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

import AiMatchShowcase from '@/Components/Landing/AiMatchShowcase';
import { MatchShowcaseItem, PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight, Award, BarChart2, Brain, Building2,
    GraduationCap, Star, Target, TrendingUp, Zap,
} from 'lucide-react';

const STATS = [
    { value: '4,820+', label: 'Graduates Placed' },
    { value: '87%', label: 'Employment Rate' },
    { value: '320+', label: 'Partner Companies' },
    { value: '96%', label: 'Survey Response' },
];

const FEATURES = [
    { icon: Brain, title: 'AI Resume Matching', desc: 'Our AI engine analyzes resumes against live job requirements and scores compatibility with precision.' },
    { icon: TrendingUp, title: 'Career Analytics', desc: 'Real-time dashboards tracking graduate employment trends, industry distribution, and career progression.' },
    { icon: Target, title: 'Skill Gap Analysis', desc: 'Identify missing competencies and get curated learning paths aligned with market demand.' },
    { icon: BarChart2, title: 'Graduate Tracer Study', desc: 'Automated surveys tracking alumni career outcomes for CHED compliance and accreditation.' },
    { icon: Building2, title: 'Employer Network', desc: 'Direct connection between UCLM graduates and 320+ verified industry partners.' },
    { icon: Award, title: 'Career Roadmap', desc: 'Personalized career development plans with milestone tracking and mentorship matching.' },
];

const TESTIMONIALS = [
    { name: 'Maria Santos', role: "BS Computer Science '22", text: "GradConnect's AI matched me with my dream job at Accenture within 2 weeks of uploading my resume. The skill gap analysis was eye-opening.", avatar: 'MS' },
    { name: 'James Ramos', role: "BS Business Admin '21", text: 'The platform helped me track my career progress and connect with alumni mentors. I got promoted to Manager within 18 months.', avatar: 'JR' },
    { name: 'Ana Reyes', role: 'Career Services Director', text: 'Our employment rate jumped from 72% to 87% after deploying GradConnect. The tracer study module alone saves us 200+ hours per cycle.', avatar: 'AR' },
];

interface Props extends PageProps { matchShowcase: MatchShowcaseItem[] }

export default function Welcome({ auth, matchShowcase }: Props) {
    return (
        <>
            <Head title="Welcome to GradConnect" />

            <div className="min-h-screen bg-white text-foreground">
                {/* Nav */}
                <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700">
                                <GraduationCap size={18} className="text-white" />
                            </div>
                            <div>
                                <span className="block text-lg font-bold leading-tight text-foreground">GradConnect</span>
                                <span className="block text-xs leading-none text-muted-foreground">UCLM Career Platform</span>
                            </div>
                        </div>
                        <div className="hidden items-center gap-8 md:flex">
                            {['Features', 'For Employers', 'Contact'].map((l) => (
                                <span key={l} className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{l}</span>
                            ))}
                            <Link href={route('about')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">About</Link>
                        </div>
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

                {/* Hero */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1f3d] via-[#1a3a6b] to-[#1a56db] text-white">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-400 blur-3xl" />
                        <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-400 blur-3xl" />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
                        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                            <div>
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold text-blue-200">
                                    <Zap size={12} /> AI-Powered Career Platform
                                </div>
                                <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
                                    Launch Your Career with <span className="text-blue-300">Intelligent</span> Guidance
                                </h1>
                                <p className="mb-8 text-lg leading-relaxed text-blue-100">
                                    UCLM's official graduate employability platform — connecting graduates with opportunities
                                    through AI resume matching, career analytics, and a nationwide employer network.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link href={auth.user ? route('dashboard') : route('register')} className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-lg transition-colors hover:bg-blue-50">
                                        {auth.user ? 'Open Dashboard' : 'Start Your Journey'} <ArrowRight size={16} />
                                    </Link>
                                    <Link href={route('login')} className="flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10">
                                        <Building2 size={16} /> For Employers
                                    </Link>
                                </div>
                            </div>

                            {/* AI match examples — stacked under the hero copy
                                on a phone, beside it from md up. */}
                            <AiMatchShowcase items={matchShowcase} />
                        </div>

                        {/* Stat row */}
                        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
                            {STATS.map((s) => (
                                <div key={s.label} className="text-center">
                                    <p className="text-3xl font-bold text-white">{s.value}</p>
                                    <p className="mt-1 text-sm text-blue-200">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="bg-[#f0f4f9] py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-foreground">Everything You Need to Succeed</h2>
                            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">A complete career development ecosystem built for UCLM graduates, alumni, and industry partners.</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                        <f.icon size={22} className="text-primary" />
                                    </div>
                                    <h3 className="mb-2 font-bold text-foreground">{f.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="bg-white py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-16 text-center">
                            <h2 className="text-3xl font-bold text-foreground">What Our Community Says</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {TESTIMONIALS.map((t) => (
                                <div key={t.name} className="rounded-2xl border border-border bg-[#f0f4f9] p-6">
                                    <div className="mb-4 flex gap-1">{Array(5).fill(0).map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                                    <p className="mb-6 text-sm leading-relaxed text-foreground">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">{t.avatar}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-gradient-to-r from-[#0f1f3d] to-[#1a56db] py-20 text-white">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h2 className="mb-4 text-3xl font-bold">Ready to Take the Next Step?</h2>
                        <p className="mb-8 text-lg text-blue-100">Join thousands of UCLM graduates building successful careers with GradConnect.</p>
                        {!auth.user && (
                            <Link href={route('register')} className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary shadow-lg transition-colors hover:bg-blue-50">
                                Create Free Account
                            </Link>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-[#0f1f3d] py-12 text-white">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-8 grid gap-8 md:grid-cols-4">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <GraduationCap size={20} className="text-blue-400" />
                                    <span className="text-lg font-bold">GradConnect</span>
                                </div>
                                <p className="text-sm leading-relaxed text-blue-200">University of Cebu Lapu-Lapu and Mandaue official graduate employability platform.</p>
                            </div>
                            {[
                                { title: 'Platform', links: ['Features', 'AI Matching', 'Tracer Study', 'Career Analytics'] },
                                { title: 'For Students', links: ['Register', 'Upload Resume', 'Browse Jobs', 'Skill Analysis'] },
                                { title: 'Contact', links: ['careers@uclm.edu.ph', '+63 32 234 5678', 'A.C. Cortes Ave., Mandaue City', 'Mon–Fri 8AM–5PM'] },
                            ].map((col) => (
                                <div key={col.title}>
                                    <p className="mb-4 text-sm font-semibold">{col.title}</p>
                                    {col.links.map((l) => <p key={l} className="mb-2 cursor-pointer text-sm text-blue-200 transition-colors hover:text-white">{l}</p>)}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
                            <p className="text-sm text-blue-300">© {new Date().getFullYear()} University of Cebu Lapu-Lapu and Mandaue. All rights reserved.</p>
                            <div className="flex gap-6">
                                <Link href={route('privacy')} className="text-sm text-blue-300 transition-colors hover:text-white">Privacy Policy</Link>
                                {['Terms of Service', 'Accessibility'].map((l) => (
                                    <span key={l} className="cursor-pointer text-sm text-blue-300 transition-colors hover:text-white">{l}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

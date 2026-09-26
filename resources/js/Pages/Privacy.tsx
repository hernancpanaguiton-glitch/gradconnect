import PublicLayout from '@/Layouts/PublicLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
    {
        title: '1. What we collect',
        body: (
            <>
                <p>GradConnect collects information you provide directly, including:</p>
                <ul className="ml-5 list-disc space-y-1">
                    <li>Account details — name, ID number, email, and password.</li>
                    <li>Graduate/alumni profile data — program, graduation year, contact details, headline, summary, skills, education, and employment history.</li>
                    <li>Uploaded or built résumés/CVs, including the text extracted from them for AI matching.</li>
                    <li>Job postings and applications submitted by industry partners and graduates.</li>
                    <li>Tracer survey and career-readiness responses.</li>
                    <li>Employer feedback on candidate competencies.</li>
                </ul>
            </>
        ),
    },
    {
        title: '2. Why we collect it',
        body: (
            <p>
                Data is used to operate the platform's core functions: authenticating accounts, matching graduates
                to job opportunities using AI (résumé/job similarity scoring), tracking employment outcomes for
                CHED-mandated tracer studies, and generating institutional reports for the Alumni Affairs Office,
                Student Affairs Office, Department Heads, and Admin. Résumé text sent to AI providers is used only
                to compute compatibility scores and is not used to train third-party models.
            </p>
        ),
    },
    {
        title: '3. Who can see your data',
        body: (
            <p>
                Access is role-based. Graduates and alumni control their own profile and résumé visibility to
                industry partners. Industry partners can view the résumés of graduates who apply to their postings,
                or who are surfaced through talent search, once granted the relevant permission. University offices
                and Admin can access aggregated and individual records necessary for tracer studies, reporting, and
                account administration. We do not sell or share your data with third parties outside these uses.
            </p>
        ),
    },
    {
        title: '4. Your rights',
        body: (
            <p>
                Under the Data Privacy Act of 2012 (RA 10173), you have the right to be informed, to access your
                data, to object to processing, to request correction or erasure, and to data portability. To
                exercise these rights, contact the University of Cebu Lapu-Lapu and Mandaue Alumni Affairs Office
                or Admin through the platform.
            </p>
        ),
    },
    {
        title: '5. Data retention & security',
        body: (
            <p>
                Data is stored in a centralized database with role-based access control and is retained for as
                long as your account is active or as needed for institutional record-keeping and accreditation
                requirements. Passwords are encrypted; access to sensitive records is limited by permission.
            </p>
        ),
    },
];

export default function Privacy({ auth }: PageProps) {
    return (
        <>
            <Head title="Privacy Policy — GradConnect" />
            <PublicLayout user={auth.user}>

                <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
                    <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                    <h1 className="mb-2 text-3xl font-bold text-foreground">Privacy Policy</h1>
                    <p className="mb-10 text-sm text-muted-foreground">
                        This policy explains how GradConnect, operated by the University of Cebu Lapu-Lapu and
                        Mandaue, collects, uses, and protects your information in compliance with the Data Privacy
                        Act of 2012 (Republic Act No. 10173).
                    </p>

                    <div className="space-y-8">
                        {SECTIONS.map((s) => (
                            <div key={s.title}>
                                <h2 className="mb-2 text-lg font-bold text-foreground">{s.title}</h2>
                                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{s.body}</div>
                            </div>
                        ))}
                    </div>
                </section>

            </PublicLayout>
        </>
    );
}

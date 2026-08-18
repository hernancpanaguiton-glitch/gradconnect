import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BarChart2 } from 'lucide-react';

interface ReportLink {
    title: string;
    desc: string;
    href: string;
}

export default function ReportsHub({ reports }: { reports: ReportLink[] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Reports" />
            <div className="space-y-6">
                <PageHeader
                    icon={BarChart2}
                    title="Reports & Analytics"
                    subtitle="Every report and directory your role has access to, in one place."
                />

                {reports.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                        <p className="text-muted-foreground">No reports are available for your role yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {reports.map((r) => (
                            <Link
                                key={r.title}
                                href={r.href}
                                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div>
                                    <p className="font-semibold text-foreground">{r.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                    Open <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

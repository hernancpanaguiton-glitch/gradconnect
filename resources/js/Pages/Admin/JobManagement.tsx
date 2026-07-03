import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Briefcase, CheckCircle2, Clock, Flag } from 'lucide-react';

const JOBS = [
    { title: 'Senior Full Stack Developer', company: 'Cebu Pacific IT', posted: '2 days ago', status: 'Approved' },
    { title: 'Backend Engineer', company: 'Accenture', posted: '3 days ago', status: 'Pending' },
    { title: 'Data Analyst', company: 'Lexmark', posted: '5 days ago', status: 'Approved' },
    { title: 'Marketing Associate', company: 'Unknown Corp', posted: '6 days ago', status: 'Flagged' },
    { title: 'Software Engineer I', company: 'Sykes', posted: '1 week ago', status: 'Approved' },
];
const STATUS: Record<string, string> = {
    Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    Flagged: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export default function JobManagement() {
    return (
        <AuthenticatedLayout>
            <Head title="Job Management" />
            <div className="space-y-6">
                <PageHeader icon={Briefcase} title="Job Management" subtitle="Moderate job postings from industry partners." />

                <div className="grid gap-5 sm:grid-cols-3">
                    <StatTile icon={CheckCircle2} color="green" label="Approved" value="128" />
                    <StatTile icon={Clock} color="amber" label="Pending Review" value="9" />
                    <StatTile icon={Flag} color="red" label="Flagged" value="2" />
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">Posting</th><th className="px-6 py-3 font-medium">Company</th><th className="px-6 py-3 font-medium">Posted</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {JOBS.map((j) => (
                                <tr key={j.title} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-medium text-foreground">{j.title}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{j.company}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{j.posted}</td>
                                    <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[j.status]}`}>{j.status}</span></td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="text-sm font-medium text-primary hover:underline">Review</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

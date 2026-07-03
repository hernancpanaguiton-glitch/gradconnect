import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { applicationFunnel } from '@/lib/demoData';
import { Head } from '@inertiajs/react';
import { Briefcase, CalendarCheck, CheckCircle2, Send } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const APPS = [
    { role: 'Senior Full Stack Developer', company: 'Cebu Pacific IT', status: 'Interview', when: '2 days ago' },
    { role: 'Backend Engineer', company: 'Accenture', status: 'Under review', when: '5 days ago' },
    { role: 'Software Engineer I', company: 'Sykes', status: 'Applied', when: '1 week ago' },
    { role: 'Data Analyst', company: 'Lexmark', status: 'Offer', when: '1 week ago' },
    { role: 'Frontend Developer', company: 'Symph', status: 'Rejected', when: '2 weeks ago' },
];
const STATUS: Record<string, string> = {
    Applied: 'bg-muted text-muted-foreground',
    'Under review': 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    Interview: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    Offer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export default function Applications() {
    return (
        <AuthenticatedLayout>
            <Head title="Applications" />
            <div className="space-y-6">
                <PageHeader icon={Briefcase} title="My Applications" subtitle="Track every role you’ve applied to and where it stands." />

                <div className="grid gap-5 sm:grid-cols-3">
                    <StatTile icon={Send} color="blue" label="Applications" value="12" sub="This cycle" />
                    <StatTile icon={CalendarCheck} color="amber" label="Interviews" value="4" />
                    <StatTile icon={CheckCircle2} color="green" label="Offers" value="2" />
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-foreground">Application activity</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={applicationFunnel} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                                <Area dataKey="applied" name="Applied" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
                                <Area dataKey="interview" name="Interview" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.15} />
                                <Area dataKey="offer" name="Offer" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Applied</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {APPS.map((a) => (
                                <tr key={a.role} className="hover:bg-muted/40">
                                    <td className="px-4 py-3 font-medium text-foreground">{a.role}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.company}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[a.status]}`}>{a.status}</span></td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.when}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

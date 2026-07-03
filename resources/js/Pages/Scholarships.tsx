import PageHeader from '@/Components/PageHeader';
import StatTile from '@/Components/StatTile';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Award, GraduationCap, Wallet } from 'lucide-react';

const SCHOLARSHIPS = [
    { name: 'CHED UniFAST Scholarship', recipients: 312, budget: '₱4.8M', status: 'Active' },
    { name: 'DOST-SEI Scholarship', recipients: 64, budget: '₱1.4M', status: 'Active' },
    { name: 'Mandaue City Scholarship', recipients: 210, budget: '₱3.1M', status: 'Pending' },
    { name: 'UCLM Academic Merit Grant', recipients: 148, budget: '₱2.0M', status: 'Active' },
];
const STATUS: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export default function Scholarships() {
    return (
        <AuthenticatedLayout>
            <Head title="Scholarships" />
            <div className="space-y-6">
                <PageHeader icon={GraduationCap} title="Scholarships" subtitle="Scholarship programs, recipients, and budgets." />

                <div className="grid gap-5 sm:grid-cols-3">
                    <StatTile icon={Award} color="amber" label="Scholarship Recipients" value="734" change="+62" />
                    <StatTile icon={GraduationCap} color="blue" label="Active Programs" value="3" />
                    <StatTile icon={Wallet} color="green" label="Total Budget" value="₱11.3M" />
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-6 py-4"><h2 className="font-bold text-foreground">Scholarship Programs</h2></div>
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                            <tr><th className="px-6 py-3 font-medium">Program</th><th className="px-6 py-3 font-medium">Recipients</th><th className="px-6 py-3 font-medium">Budget</th><th className="px-6 py-3 font-medium">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {SCHOLARSHIPS.map((s) => (
                                <tr key={s.name} className="hover:bg-muted/40">
                                    <td className="px-6 py-3 font-medium text-foreground">{s.name}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{s.recipients}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{s.budget}</td>
                                    <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[s.status]}`}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

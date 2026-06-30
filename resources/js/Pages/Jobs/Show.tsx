import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

/** Render a "30000-50000" / "80000+" range as a peso, comma-grouped monthly figure. */
function formatSalary(range: string): string {
    const nums = range.match(/\d+/g);
    if (!nums || nums.length === 0) {
        return range;
    }
    const parts = nums.map((n) => Number(n).toLocaleString());
    const plus = range.includes('+') ? '+' : '';
    return parts.length === 1
        ? `₱${parts[0]}${plus} / month`
        : `₱${parts[0]}–${parts[1]} / month`;
}

function MetaField({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`mt-0.5 text-sm font-medium text-gray-800 ${valueClass}`}>{value}</p>
        </div>
    );
}

interface JobPosting {
    id: number; title: string; description: string; responsibilities: string | null;
    qualifications: string | null; employment_type: string; location: string | null;
    is_remote: boolean; salary_range: string | null; experience_level: string | null;
    status: string; application_deadline: string | null;
    company: { id: number; name: string; industry: string | null; location: string | null; website: string | null; is_verified: boolean };
    skills: Array<{ id: number; name: string; pivot: { is_required: boolean } }>;
}
interface Application { id: number; status: string }
interface Props extends PageProps { posting: JobPosting; userApplication: Application | null }

export default function JobShow({ posting, userApplication }: Props) {
    const { auth, flash } = usePage<Props>().props;
    const user = auth.user;
    const isGraduate = user.roles.includes('alumni') || user.roles.includes('student');

    function apply() {
        if (!confirm('Apply for this position?')) return;
        router.post(route('applications.store', posting.id));
    }

    function withdraw() {
        if (!userApplication) return;
        if (!confirm('Withdraw your application?')) return;
        router.patch(route('applications.withdraw', userApplication.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title={posting.title} />
            <div className="max-w-3xl space-y-5">
                <div className="flex items-center gap-3">
                    <Link href={route('jobs.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Job Board</Link>
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                {/* Header */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900">{posting.title}</h1>
                            <p className="mt-1 text-gray-600">{posting.company.name}
                                {posting.company.is_verified && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Verified</span>}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
                                <MetaField label="Employment Type" value={posting.employment_type.replace(/_/g, ' ')} valueClass="capitalize" />
                                <MetaField label="Location" value={posting.is_remote ? 'Remote' : (posting.location ?? 'On-site')} />
                                {posting.salary_range && <MetaField label="Salary Range" value={formatSalary(posting.salary_range)} />}
                                {posting.application_deadline && (
                                    <MetaField
                                        label="Application Deadline"
                                        value={new Date(posting.application_deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    />
                                )}
                            </div>
                        </div>
                        {isGraduate && (
                            <div className="shrink-0">
                                {!userApplication ? (
                                    <button onClick={apply}
                                        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                                        Apply Now
                                    </button>
                                ) : (
                                    <div className="text-right">
                                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 capitalize">
                                            Applied · {userApplication.status.replace(/_/g, ' ')}
                                        </span>
                                        {userApplication.status === 'submitted' && (
                                            <button onClick={withdraw} className="block mt-1 text-xs text-red-500 hover:text-red-700">
                                                Withdraw
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Required Skills */}
                {posting.skills.length > 0 && (
                    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {posting.skills.map((s) => (
                                <span key={s.id} className={`rounded-full px-3 py-1 text-sm ${s.pivot.is_required ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>
                                    {s.name}{s.pivot.is_required ? ' *' : ''}
                                </span>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">* Required</p>
                    </div>
                )}

                {/* Description */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700 mb-2">Job Description</h2>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{posting.description}</p>
                    </div>
                    {posting.qualifications && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">Qualifications</h2>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{posting.qualifications}</p>
                        </div>
                    )}
                </div>

                {/* Company */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">About the Company</h2>
                    <p className="font-medium text-gray-900">{posting.company.name}</p>
                    {posting.company.industry && <p className="text-sm text-gray-500">{posting.company.industry}</p>}
                    {posting.company.location && <p className="text-sm text-gray-500">{posting.company.location}</p>}
                    {posting.company.website && (
                        <a href={posting.company.website} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 block">
                            {posting.company.website}
                        </a>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

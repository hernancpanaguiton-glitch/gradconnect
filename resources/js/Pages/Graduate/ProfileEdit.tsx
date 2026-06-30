import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Skill { id: number; name: string; category: string | null; slug: string }
interface EducationRecord {
    id: number; institution: string; degree: string; field_of_study: string | null;
    start_year: number | null; end_year: number | null; honors: string | null;
}
interface EmploymentRecord {
    id: number; company_name: string; job_title: string; employment_type: string;
    is_current: boolean; start_date: string | null; end_date: string | null;
    industry: string | null; location: string | null; is_related_to_course: boolean | null;
}
interface GraduateProfile {
    id: number; program: string | null; graduation_year: number | null;
    expected_graduation_year: number | null; gender: string | null; birthdate: string | null;
    phone: string | null; address: string | null; city: string | null;
    linkedin_url: string | null; headline: string | null; summary: string | null;
    current_employment_status: string | null; willing_to_relocate: boolean;
    profile_completion: number;
    education_records: EducationRecord[];
    employment_records: EmploymentRecord[];
    skills: Array<Skill & { pivot: { proficiency: string | null; source: string } }>;
}
interface Props extends PageProps { profile: GraduateProfile; allSkills: Skill[] }

type Tab = 'basic' | 'education' | 'employment' | 'skills';

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Input({ value, onChange, type = 'text', placeholder }: {
    value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
    return (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    );
}

function Select({ value, onChange, options }: {
    value: string; onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>
}) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">— Select —</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

export default function ProfileEdit({ profile, allSkills }: Props) {
    const { flash } = usePage<Props>().props;
    const [tab, setTab] = useState<Tab>('basic');

    const { data, setData, patch, processing, errors } = useForm({
        program: profile.program ?? '',
        graduation_year: profile.graduation_year?.toString() ?? '',
        expected_graduation_year: profile.expected_graduation_year?.toString() ?? '',
        gender: profile.gender ?? '',
        birthdate: profile.birthdate ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        headline: profile.headline ?? '',
        summary: profile.summary ?? '',
        current_employment_status: profile.current_employment_status ?? '',
        willing_to_relocate: profile.willing_to_relocate,
        skills: profile.skills.map((s) => s.id),
    });

    function saveProfile(e: FormEvent) {
        e.preventDefault();
        patch(route('graduate.profile.update'));
    }

    // Education
    const [eduForm, setEduForm] = useState({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', honors: '' });
    function addEducation(e: FormEvent) {
        e.preventDefault();
        router.post(route('education.store'), eduForm, {
            preserveScroll: true,
            onSuccess: () => setEduForm({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', honors: '' }),
        });
    }
    function deleteEducation(id: number) {
        if (!confirm('Delete this education record?')) return;
        router.delete(route('education.destroy', id), { preserveScroll: true });
    }

    // Employment
    const [empForm, setEmpForm] = useState({ company_name: '', job_title: '', employment_type: 'full_time', is_current: false, start_date: '', end_date: '' });
    function addEmployment(e: FormEvent) {
        e.preventDefault();
        router.post(route('employment.store'), empForm, {
            preserveScroll: true,
            onSuccess: () => setEmpForm({ company_name: '', job_title: '', employment_type: 'full_time', is_current: false, start_date: '', end_date: '' }),
        });
    }
    function deleteEmployment(id: number) {
        if (!confirm('Delete this employment record?')) return;
        router.delete(route('employment.destroy', id), { preserveScroll: true });
    }

    function toggleSkill(skillId: number) {
        setData('skills', data.skills.includes(skillId)
            ? data.skills.filter((id) => id !== skillId)
            : [...data.skills, skillId]);
    }

    const skillsByCategory = allSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
        const cat = skill.category ?? 'Other';
        acc[cat] = [...(acc[cat] ?? []), skill];
        return acc;
    }, {});

    const tabs: Array<{ key: Tab; label: string }> = [
        { key: 'basic', label: 'Basic Info' },
        { key: 'education', label: `Education (${profile.education_records.length})` },
        { key: 'employment', label: `Employment (${profile.employment_records.length})` },
        { key: 'skills', label: `Skills (${data.skills.length})` },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Edit Profile" />

            <div className="max-w-3xl space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">My Career Profile</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${profile.profile_completion}%` }} />
                        </div>
                        <span className="text-sm text-gray-500">{profile.profile_completion}% complete</span>
                    </div>
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 gap-1">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Basic Info */}
                {tab === 'basic' && (
                    <form onSubmit={saveProfile} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Program / Course" error={errors.program}>
                                <Input value={data.program} onChange={(v) => setData('program', v)} placeholder="e.g. BS Information Technology" />
                            </Field>
                            <Field label="Graduation Year" error={errors.graduation_year}>
                                <Input value={data.graduation_year} onChange={(v) => setData('graduation_year', v)} type="number" placeholder="2024" />
                            </Field>
                            <Field label="Gender">
                                <Select value={data.gender} onChange={(v) => setData('gender', v)}
                                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }]} />
                            </Field>
                            <Field label="Date of Birth">
                                <Input value={data.birthdate} onChange={(v) => setData('birthdate', v)} type="date" />
                            </Field>
                            <Field label="Phone">
                                <Input value={data.phone} onChange={(v) => setData('phone', v)} placeholder="+63 9XX XXX XXXX" />
                            </Field>
                            <Field label="City">
                                <Input value={data.city} onChange={(v) => setData('city', v)} placeholder="Cebu City" />
                            </Field>
                        </div>
                        <Field label="LinkedIn URL">
                            <Input value={data.linkedin_url} onChange={(v) => setData('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
                        </Field>
                        <Field label="Professional Headline">
                            <Input value={data.headline} onChange={(v) => setData('headline', v)} placeholder="Software Engineer at ACME Corp" />
                        </Field>
                        <Field label="Professional Summary">
                            <textarea value={data.summary} onChange={(e) => setData('summary', e.target.value)} rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Brief description of your background and career goals..." />
                        </Field>
                        <Field label="Employment Status">
                            <Select value={data.current_employment_status} onChange={(v) => setData('current_employment_status', v)}
                                options={[
                                    { value: 'employed', label: 'Employed' },
                                    { value: 'unemployed', label: 'Unemployed' },
                                    { value: 'self_employed', label: 'Self-Employed' },
                                    { value: 'further_study', label: 'Further Study' },
                                    { value: 'not_seeking', label: 'Not Seeking' },
                                ]} />
                        </Field>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.willing_to_relocate} onChange={(e) => setData('willing_to_relocate', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm text-gray-700">Willing to relocate</span>
                        </label>
                        <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Profile
                        </button>
                    </form>
                )}

                {/* Education */}
                {tab === 'education' && (
                    <div className="space-y-4">
                        {profile.education_records.map((rec) => (
                            <div key={rec.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">{rec.institution}</p>
                                    <p className="text-sm text-gray-600">{rec.degree}{rec.field_of_study ? ` — ${rec.field_of_study}` : ''}</p>
                                    {(rec.start_year || rec.end_year) && <p className="text-xs text-gray-400">{rec.start_year ?? '?'} – {rec.end_year ?? 'present'}</p>}
                                    {rec.honors && <p className="text-xs text-indigo-600 mt-0.5">{rec.honors}</p>}
                                </div>
                                <button onClick={() => deleteEducation(rec.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                            </div>
                        ))}
                        <form onSubmit={addEducation} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
                            <p className="text-sm font-medium text-gray-700">Add Education Record</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Institution">
                                    <Input value={eduForm.institution} onChange={(v) => setEduForm((f) => ({ ...f, institution: v }))} placeholder="University of Cebu" />
                                </Field>
                                <Field label="Degree">
                                    <Input value={eduForm.degree} onChange={(v) => setEduForm((f) => ({ ...f, degree: v }))} placeholder="Bachelor of Science" />
                                </Field>
                                <Field label="Field of Study">
                                    <Input value={eduForm.field_of_study} onChange={(v) => setEduForm((f) => ({ ...f, field_of_study: v }))} placeholder="Information Technology" />
                                </Field>
                                <Field label="Honors / Awards">
                                    <Input value={eduForm.honors} onChange={(v) => setEduForm((f) => ({ ...f, honors: v }))} placeholder="Cum Laude" />
                                </Field>
                                <Field label="Start Year">
                                    <Input value={eduForm.start_year} onChange={(v) => setEduForm((f) => ({ ...f, start_year: v }))} type="number" placeholder="2019" />
                                </Field>
                                <Field label="End Year">
                                    <Input value={eduForm.end_year} onChange={(v) => setEduForm((f) => ({ ...f, end_year: v }))} type="number" placeholder="2023" />
                                </Field>
                            </div>
                            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add</button>
                        </form>
                    </div>
                )}

                {/* Employment */}
                {tab === 'employment' && (
                    <div className="space-y-4">
                        {profile.employment_records.map((rec) => (
                            <div key={rec.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-900">{rec.job_title}</p>
                                    <p className="text-sm text-gray-600">{rec.company_name}{rec.industry ? ` · ${rec.industry}` : ''}</p>
                                    <p className="text-xs text-gray-400">{rec.employment_type.replace(/_/g, ' ')} · {rec.start_date ?? '?'} – {rec.is_current ? 'Present' : (rec.end_date ?? '?')}</p>
                                </div>
                                <button onClick={() => deleteEmployment(rec.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                            </div>
                        ))}
                        <form onSubmit={addEmployment} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
                            <p className="text-sm font-medium text-gray-700">Add Employment Record</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Company Name">
                                    <Input value={empForm.company_name} onChange={(v) => setEmpForm((f) => ({ ...f, company_name: v }))} placeholder="ACME Corporation" />
                                </Field>
                                <Field label="Job Title">
                                    <Input value={empForm.job_title} onChange={(v) => setEmpForm((f) => ({ ...f, job_title: v }))} placeholder="Software Engineer" />
                                </Field>
                                <Field label="Employment Type">
                                    <Select value={empForm.employment_type} onChange={(v) => setEmpForm((f) => ({ ...f, employment_type: v }))}
                                        options={[
                                            { value: 'full_time', label: 'Full-time' },
                                            { value: 'part_time', label: 'Part-time' },
                                            { value: 'contract', label: 'Contract' },
                                            { value: 'internship', label: 'Internship' },
                                            { value: 'freelance', label: 'Freelance' },
                                        ]} />
                                </Field>
                                <Field label="Start Date">
                                    <Input value={empForm.start_date} onChange={(v) => setEmpForm((f) => ({ ...f, start_date: v }))} type="date" />
                                </Field>
                                <Field label="End Date">
                                    <Input value={empForm.end_date} onChange={(v) => setEmpForm((f) => ({ ...f, end_date: v }))} type="date" />
                                </Field>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={empForm.is_current} onChange={(e) => setEmpForm((f) => ({ ...f, is_current: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                                <span className="text-sm text-gray-700">Currently working here</span>
                            </label>
                            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add</button>
                        </form>
                    </div>
                )}

                {/* Skills */}
                {tab === 'skills' && (
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-5">
                        {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                            <div key={cat}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{cat}</p>
                                <div className="flex flex-wrap gap-2">
                                    {catSkills.map((skill) => {
                                        const selected = data.skills.includes(skill.id);
                                        return (
                                            <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)}
                                                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                                {skill.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <button onClick={saveProfile as unknown as React.MouseEventHandler} disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Skills
                        </button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

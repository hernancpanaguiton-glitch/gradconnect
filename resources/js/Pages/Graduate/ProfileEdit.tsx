import ScrollTabs from '@/Components/ScrollTabs';
import SkillCategoryPicker from '@/Components/SkillCategoryPicker';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { College, PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';

interface SkillSuggestion { id: number | null; name: string; source: string }

/** Format an ISO date string (e.g. "2025-04-21T00:00:00.000000Z") as "Apr 2025". */
function formatMonthYear(value: string | null): string {
    if (!value) {
        return '?';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

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
    department_id: number | null;
    profile_completion: number;
    education_records: EducationRecord[];
    employment_records: EmploymentRecord[];
    skills: Array<Skill & { pivot: { proficiency: string | null; source: string } }>;
}
interface Props extends PageProps {
    profile: GraduateProfile;
    allSkills: Skill[];
    colleges: College[];
    selectedCollegeId: number | null;
    selectedProgramId: number | null;
    skillCategory: string | null;
}

type Tab = 'basic' | 'education' | 'employment' | 'skills';

/** Sentinel for "my program is not in the list" — reveals the free-text field. */
const PROGRAM_NOT_LISTED = 'not-listed';

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function Input({ value, onChange, type = 'text', placeholder, disabled = false }: {
    value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean
}) {
    return (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" />
    );
}

function Select({ value, onChange, options, disabled = false, placeholder = '— Select —' }: {
    value: string; onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
    disabled?: boolean; placeholder?: string;
}) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-background disabled:text-muted-foreground">
            <option value="">{placeholder}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

export default function ProfileEdit({
    profile, allSkills, colleges, selectedCollegeId, selectedProgramId, skillCategory,
}: Props) {
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
        college_id: selectedCollegeId ? String(selectedCollegeId) : '',
        program_id: selectedProgramId ? String(selectedProgramId) : '',
        skills: profile.skills.map((s) => s.id),
    });

    // Graduates whose program predates the catalogue keep their typed course.
    const [programNotListed, setProgramNotListed] = useState(!selectedProgramId && Boolean(profile.program));

    const selectedCollege = colleges.find((c) => String(c.id) === data.college_id);
    const programs = selectedCollege?.children ?? [];

    function changeCollege(value: string) {
        setData((current) => ({
            ...current,
            college_id: value,
            // The previous program almost certainly belongs to the old college.
            program_id: colleges
                .find((c) => String(c.id) === value)
                ?.children?.some((p) => String(p.id) === current.program_id)
                ? current.program_id
                : '',
        }));
    }

    function changeProgram(value: string) {
        setProgramNotListed(value === PROGRAM_NOT_LISTED);
        setData('program_id', value === PROGRAM_NOT_LISTED ? '' : value);
    }

    function saveProfile(e: FormEvent) {
        e.preventDefault();
        patch(route('graduate.profile.update'), {
            preserveScroll: true,
            // Every field with an error message lives on the Basic tab, so a
            // save from the Skills tab would otherwise fail in silence.
            onError: () => setTab('basic'),
        });
    }

    // Education
    const [eduForm, setEduForm] = useState({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', honors: '' });
    // These forms post through the router rather than useForm, so their
    // rejections never reached useForm's `errors` — a missing Institution
    // simply made the Add button do nothing at all.
    const [eduErrors, setEduErrors] = useState<Record<string, string>>({});
    const [eduSaving, setEduSaving] = useState(false);
    function addEducation(e: FormEvent) {
        e.preventDefault();
        setEduSaving(true);
        router.post(route('education.store'), eduForm, {
            preserveScroll: true,
            onSuccess: () => {
                setEduErrors({});
                setEduForm({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', honors: '' });
            },
            onError: (errors) => setEduErrors(errors as Record<string, string>),
            onFinish: () => setEduSaving(false),
        });
    }
    function deleteEducation(id: number) {
        if (!confirm('Delete this education record?')) return;
        router.delete(route('education.destroy', id), { preserveScroll: true });
    }

    // Employment
    const [empForm, setEmpForm] = useState({ company_name: '', job_title: '', employment_type: 'full_time', is_current: false, start_date: '', end_date: '' });
    const [empErrors, setEmpErrors] = useState<Record<string, string>>({});
    const [empSaving, setEmpSaving] = useState(false);
    function addEmployment(e: FormEvent) {
        e.preventDefault();
        setEmpSaving(true);
        router.post(route('employment.store'), empForm, {
            preserveScroll: true,
            onSuccess: () => {
                setEmpErrors({});
                setEmpForm({ company_name: '', job_title: '', employment_type: 'full_time', is_current: false, start_date: '', end_date: '' });
            },
            onError: (errors) => setEmpErrors(errors as Record<string, string>),
            onFinish: () => setEmpSaving(false),
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

    // Skills library starts from the seeded list and grows as the user adds
    // custom, AI-validated skills.
    const [skillLibrary, setSkillLibrary] = useState<Skill[]>(allSkills);
    const [skillQuery, setSkillQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
    const [skillLoading, setSkillLoading] = useState(false);
    const [addingSkill, setAddingSkill] = useState(false);
    const [skillError, setSkillError] = useState<string | null>(null);

    // Debounced AI + library autocomplete.
    useEffect(() => {
        const query = skillQuery.trim();
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }
        setSkillLoading(true);
        const handle = setTimeout(() => {
            axios.get(route('skills.suggest'), { params: { q: query } })
                .then((response) => setSuggestions(response.data.suggestions ?? []))
                .catch(() => setSuggestions([]))
                .finally(() => setSkillLoading(false));
        }, 300);
        return () => clearTimeout(handle);
    }, [skillQuery]);

    function selectSkill(skillId: number, skill?: Skill) {
        if (skill && !skillLibrary.some((s) => s.id === skillId)) {
            setSkillLibrary((prev) => [...prev, skill]);
        }
        if (!data.skills.includes(skillId)) {
            setData('skills', [...data.skills, skillId]);
        }
        setSkillQuery('');
        setSuggestions([]);
    }

    async function addSuggestion(item: SkillSuggestion) {
        setSkillError(null);

        // Library skills already exist — just select them.
        if (item.id) {
            selectSkill(item.id, { id: item.id, name: item.name, category: 'My Skills', slug: '' });
            return;
        }

        // AI / free-typed skills are validated + created server-side first.
        setAddingSkill(true);
        try {
            const response = await axios.post(route('skills.store'), { name: item.name });
            const skill: Skill = { ...response.data.skill, category: response.data.skill.category ?? 'My Skills' };
            selectSkill(skill.id, skill);
        } catch (error) {
            const errData = (error as { response?: { data?: { errors?: { name?: string[] }; message?: string } } }).response?.data;
            setSkillError(errData?.errors?.name?.[0] ?? errData?.message ?? 'Could not add that skill.');
        } finally {
            setAddingSkill(false);
        }
    }

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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">My Career Profile</h1>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted sm:w-32">
                            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${profile.profile_completion}%` }} />
                        </div>
                        <span className="whitespace-nowrap text-sm text-muted-foreground">{profile.profile_completion}% complete</span>
                    </div>
                </div>

                {/*
                    Four labelled tabs need more width than a phone has. As a
                    plain row they pushed the whole page sideways, which is
                    what clipped the fields on every other tab.
                */}
                <ScrollTabs tabs={tabs} active={tab} onChange={setTab} />

                {/* Basic Info */}
                {tab === 'basic' && (
                    <form onSubmit={saveProfile} className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                        <div className="form-grid">
                            <Field label="College" error={errors.college_id}>
                                <Select value={data.college_id} onChange={changeCollege}
                                    options={colleges.map((c) => ({ value: String(c.id), label: c.name }))} />
                            </Field>
                            <Field label="Program / Course" error={errors.program_id}>
                                <Select
                                    value={programNotListed ? PROGRAM_NOT_LISTED : data.program_id}
                                    onChange={changeProgram}
                                    disabled={!data.college_id}
                                    placeholder={data.college_id ? '— Select —' : 'Choose a college first'}
                                    options={[
                                        ...programs.map((p) => ({ value: String(p.id), label: p.name })),
                                        { value: PROGRAM_NOT_LISTED, label: 'Not listed — type it instead' },
                                    ]} />
                            </Field>
                            <Field label="Graduation Year" error={errors.graduation_year}>
                                <Input value={data.graduation_year} onChange={(v) => setData('graduation_year', v)} type="number" placeholder="2024" />
                            </Field>
                            <Field label="Gender" error={errors.gender}>
                                <Select value={data.gender} onChange={(v) => setData('gender', v)}
                                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }]} />
                            </Field>
                            <Field label="Date of Birth" error={errors.birthdate}>
                                <Input value={data.birthdate} onChange={(v) => setData('birthdate', v)} type="date" />
                            </Field>
                            <Field label="Phone" error={errors.phone}>
                                <Input value={data.phone} onChange={(v) => setData('phone', v)} placeholder="+63 9XX XXX XXXX" />
                            </Field>
                            <Field label="City" error={errors.city}>
                                <Input value={data.city} onChange={(v) => setData('city', v)} placeholder="Cebu City" />
                            </Field>
                        </div>
                        {programNotListed && (
                            <Field label="Program / Course (typed)" error={errors.program}>
                                <Input value={data.program} onChange={(v) => setData('program', v)} placeholder="e.g. BS Information Technology" />
                            </Field>
                        )}
                        <Field label="LinkedIn URL" error={errors.linkedin_url}>
                            <Input value={data.linkedin_url} onChange={(v) => setData('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
                        </Field>
                        <Field label="Professional Headline" error={errors.headline}>
                            <Input value={data.headline} onChange={(v) => setData('headline', v)} placeholder="Software Engineer at ACME Corp" />
                        </Field>
                        <Field label="Professional Summary" error={errors.summary}>
                            <textarea value={data.summary} onChange={(e) => setData('summary', e.target.value)} rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Brief description of your background and career goals..." />
                        </Field>
                        <Field label="Employment Status" error={errors.current_employment_status}>
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
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-indigo-500" />
                            <span className="text-sm text-foreground">Willing to relocate</span>
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
                            <div key={rec.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-gray-200 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-foreground">{rec.institution}</p>
                                    <p className="text-sm text-muted-foreground">{rec.degree}{rec.field_of_study ? ` — ${rec.field_of_study}` : ''}</p>
                                    {(rec.start_year || rec.end_year) && <p className="text-xs text-muted-foreground">{rec.start_year ?? '?'} – {rec.end_year ?? 'present'}</p>}
                                    {rec.honors && <p className="text-xs text-primary mt-0.5">{rec.honors}</p>}
                                </div>
                                <button onClick={() => deleteEducation(rec.id)} className="text-red-400 hover:text-destructive text-xs">Remove</button>
                            </div>
                        ))}
                        <form onSubmit={addEducation} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
                            <p className="text-sm font-medium text-foreground">Add Education Record</p>
                            <div className="form-grid-tight">
                                <Field label="Institution" error={eduErrors.institution}>
                                    <Input value={eduForm.institution} onChange={(v) => setEduForm((f) => ({ ...f, institution: v }))} placeholder="University of Cebu" />
                                </Field>
                                <Field label="Degree" error={eduErrors.degree}>
                                    <Input value={eduForm.degree} onChange={(v) => setEduForm((f) => ({ ...f, degree: v }))} placeholder="Bachelor of Science" />
                                </Field>
                                <Field label="Field of Study" error={eduErrors.field_of_study}>
                                    <Input value={eduForm.field_of_study} onChange={(v) => setEduForm((f) => ({ ...f, field_of_study: v }))} placeholder="Information Technology" />
                                </Field>
                                <Field label="Honors / Awards" error={eduErrors.honors}>
                                    <Input value={eduForm.honors} onChange={(v) => setEduForm((f) => ({ ...f, honors: v }))} placeholder="Cum Laude" />
                                </Field>
                                <Field label="Start Year" error={eduErrors.start_year}>
                                    <Input value={eduForm.start_year} onChange={(v) => setEduForm((f) => ({ ...f, start_year: v }))} type="number" placeholder="2019" />
                                </Field>
                                <Field label="End Year" error={eduErrors.end_year}>
                                    <Input value={eduForm.end_year} onChange={(v) => setEduForm((f) => ({ ...f, end_year: v }))} type="number" placeholder="2023" />
                                </Field>
                            </div>
                            <button type="submit" disabled={eduSaving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
                        </form>
                    </div>
                )}

                {/* Employment */}
                {tab === 'employment' && (
                    <div className="space-y-4">
                        {profile.employment_records.map((rec) => (
                            <div key={rec.id} className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-gray-200 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-foreground">{rec.job_title}</p>
                                    <p className="text-sm text-muted-foreground">{rec.company_name}{rec.industry ? ` · ${rec.industry}` : ''}</p>
                                    <p className="text-xs text-muted-foreground">{rec.employment_type.replace(/_/g, ' ')} · {formatMonthYear(rec.start_date)} – {rec.is_current ? 'Present' : formatMonthYear(rec.end_date)}</p>
                                </div>
                                <button onClick={() => deleteEmployment(rec.id)} className="text-red-400 hover:text-destructive text-xs">Remove</button>
                            </div>
                        ))}
                        <form onSubmit={addEmployment} className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
                            <p className="text-sm font-medium text-foreground">Add Employment Record</p>
                            <div className="form-grid-tight">
                                <Field label="Company Name" error={empErrors.company_name}>
                                    <Input value={empForm.company_name} onChange={(v) => setEmpForm((f) => ({ ...f, company_name: v }))} placeholder="ACME Corporation" />
                                </Field>
                                <Field label="Job Title" error={empErrors.job_title}>
                                    <Input value={empForm.job_title} onChange={(v) => setEmpForm((f) => ({ ...f, job_title: v }))} placeholder="Software Engineer" />
                                </Field>
                                <Field label="Employment Type" error={empErrors.employment_type}>
                                    <Select value={empForm.employment_type} onChange={(v) => setEmpForm((f) => ({ ...f, employment_type: v }))}
                                        options={[
                                            { value: 'full_time', label: 'Full-time' },
                                            { value: 'part_time', label: 'Part-time' },
                                            { value: 'contract', label: 'Contract' },
                                            { value: 'internship', label: 'Internship' },
                                            { value: 'freelance', label: 'Freelance' },
                                        ]} />
                                </Field>
                                <Field label="Start Date" error={empErrors.start_date}>
                                    <Input value={empForm.start_date} onChange={(v) => setEmpForm((f) => ({ ...f, start_date: v }))} type="date" />
                                </Field>
                                <Field label="End Date" error={empErrors.end_date}>
                                    {/* A current role has no end date; leaving this
                                        editable let a contradictory pair be submitted. */}
                                    <Input value={empForm.end_date} onChange={(v) => setEmpForm((f) => ({ ...f, end_date: v }))} type="date"
                                        disabled={empForm.is_current} />
                                </Field>
                            </div>
                            <label className="flex min-h-10 items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={empForm.is_current}
                                    onChange={(e) => setEmpForm((f) => ({ ...f, is_current: e.target.checked, end_date: e.target.checked ? '' : f.end_date }))}
                                    className="h-4 w-4 rounded border-gray-300 text-primary" />
                                <span className="text-sm text-foreground">Currently working here</span>
                            </label>
                            <button type="submit" disabled={empSaving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
                        </form>
                    </div>
                )}

                {/* Skills */}
                {tab === 'skills' && (
                    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-5">
                        {/* Add a custom skill with AI autocomplete */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-foreground mb-1">Add a skill</label>
                            <input
                                type="text"
                                value={skillQuery}
                                onChange={(e) => { setSkillQuery(e.target.value); setSkillError(null); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (skillQuery.trim().length >= 2) {
                                            addSuggestion({ id: null, name: skillQuery.trim(), source: 'typed' });
                                        }
                                    }
                                }}
                                placeholder="Type a skill, e.g. Kubernetes"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Suggestions are checked by AI so only real skills are added. Press Enter to add what you typed.
                            </p>
                            {skillError && <p className="mt-1 text-xs text-destructive">{skillError}</p>}

                            {(skillLoading || suggestions.length > 0) && skillQuery.trim().length >= 2 && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-card shadow-lg">
                                    {skillLoading && suggestions.length === 0 && (
                                        <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                                    )}
                                    {suggestions.map((item, index) => (
                                        <button
                                            key={`${item.name}-${index}`}
                                            type="button"
                                            disabled={addingSkill}
                                            onClick={() => addSuggestion(item)}
                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 disabled:opacity-50">
                                            <span className="text-foreground">{item.name}</span>
                                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${item.source === 'library' ? 'bg-muted text-muted-foreground' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {item.source === 'library' ? 'In library' : 'AI suggested'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <SkillCategoryPicker skills={skillLibrary} selectedIds={data.skills}
                            onToggle={toggleSkill} openCategory={skillCategory} />

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

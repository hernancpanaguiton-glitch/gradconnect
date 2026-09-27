import SkillCategoryPicker from '@/Components/SkillCategoryPicker';
import axios from 'axios';
import { useEffect, useState } from 'react';

export interface Skill { id: number; name: string; category: string | null }
export interface SkillPivot { id: number; is_required: boolean; weight: number }
interface SkillSuggestion { id: number | null; name: string; source: string }

export interface PostingData {
    title: string;
    description: string;
    qualifications: string;
    employment_type: string;
    status: string;
    location: string;
    is_remote: boolean;
    salary_range: string;
    application_deadline: string;
    skills: SkillPivot[];
}

/**
 * Inertia's setData in the two shapes this form uses. The updater form is what
 * the skill toggles need: chips can be clicked faster than React re-renders,
 * and a key/value call built from the render-scoped `data` would drop whichever
 * click landed first.
 */
export interface SetPostingData {
    (key: string, value: unknown): void;
    (updater: (current: PostingData) => PostingData): void;
}

interface Props {
    data: PostingData;
    setData: SetPostingData;
    errors: Partial<Record<string, string>>;
    skills: Skill[];
}

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function PostingFormFields({ data, setData, errors, skills }: Props) {
    const [skillLibrary, setSkillLibrary] = useState<Skill[]>(skills);

    // ── Job title autocomplete ────────────────────────────────────────
    const [titleFocused, setTitleFocused] = useState(false);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [titleLoading, setTitleLoading] = useState(false);

    useEffect(() => {
        if (!titleFocused || data.title.trim().length < 2) {
            setTitleSuggestions([]);
            // The in-flight request is abandoned below, so its .finally never
            // runs — clear the spinner here or it stays up forever.
            setTitleLoading(false);
            return;
        }
        setTitleLoading(true);
        const controller = new AbortController();
        const handle = setTimeout(() => {
            axios.get(route('postings.assist.titles'), { params: { q: data.title }, signal: controller.signal })
                .then((r) => { if (!controller.signal.aborted) setTitleSuggestions(r.data.titles ?? []); })
                .catch(() => { if (!controller.signal.aborted) setTitleSuggestions([]); })
                .finally(() => { if (!controller.signal.aborted) setTitleLoading(false); });
        }, 300);
        // These suggestions are LLM-backed, so an earlier query can answer last.
        // Aborting ties the response to the query that asked for it.
        return () => { clearTimeout(handle); controller.abort(); };
    }, [data.title, titleFocused]);

    // ── AI generation for description / qualifications ────────────────
    const [genError, setGenError] = useState<string | null>(null);
    const [generatingDesc, setGeneratingDesc] = useState(false);
    const [generatingQual, setGeneratingQual] = useState(false);

    function aiErrorMessage(error: unknown): string {
        const payload = (error as { response?: { data?: { message?: string } } }).response?.data;
        return payload?.message ?? 'AI generation failed. Please try again.';
    }

    async function generateDescription() {
        if (!data.title.trim()) { setGenError('Enter a job title first.'); return; }
        setGenError(null);
        setGeneratingDesc(true);
        try {
            const r = await axios.post(route('postings.assist.description'), { title: data.title });
            setData('description', r.data.text);
        } catch (error) {
            setGenError(aiErrorMessage(error));
        } finally {
            setGeneratingDesc(false);
        }
    }

    async function generateQualifications() {
        if (!data.title.trim()) { setGenError('Enter a job title first.'); return; }
        setGenError(null);
        setGeneratingQual(true);
        try {
            const r = await axios.post(route('postings.assist.qualifications'), {
                title: data.title,
                description: data.description,
            });
            setData('qualifications', r.data.text);
        } catch (error) {
            setGenError(aiErrorMessage(error));
        } finally {
            setGeneratingQual(false);
        }
    }

    // ── Required skills (library + AI-validated custom) ───────────────
    const [skillQuery, setSkillQuery] = useState('');
    const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestion[]>([]);
    const [skillLoading, setSkillLoading] = useState(false);
    const [addingSkill, setAddingSkill] = useState(false);
    const [skillError, setSkillError] = useState<string | null>(null);

    useEffect(() => {
        const query = skillQuery.trim();
        if (query.length < 2) { setSkillSuggestions([]); setSkillLoading(false); return; }
        setSkillLoading(true);
        const controller = new AbortController();
        const handle = setTimeout(() => {
            axios.get(route('skills.suggest'), { params: { q: query }, signal: controller.signal })
                .then((r) => { if (!controller.signal.aborted) setSkillSuggestions(r.data.suggestions ?? []); })
                .catch(() => { if (!controller.signal.aborted) setSkillSuggestions([]); })
                .finally(() => { if (!controller.signal.aborted) setSkillLoading(false); });
        }, 300);
        return () => { clearTimeout(handle); controller.abort(); };
    }, [skillQuery]);

    function toggleSkill(skillId: number) {
        setData((current) => ({
            ...current,
            skills: current.skills.some((s) => s.id === skillId)
                ? current.skills.filter((s) => s.id !== skillId)
                : [...current.skills, { id: skillId, is_required: true, weight: 3 }],
        }));
    }

    function selectSkill(skill: Skill) {
        if (!skillLibrary.some((s) => s.id === skill.id)) {
            setSkillLibrary((prev) => [...prev, skill]);
        }
        setData((current) => current.skills.some((s) => s.id === skill.id)
            ? current
            : { ...current, skills: [...current.skills, { id: skill.id, is_required: true, weight: 3 }] });
        setSkillQuery('');
        setSkillSuggestions([]);
    }

    async function addSuggestion(item: SkillSuggestion) {
        setSkillError(null);
        if (item.id) {
            selectSkill({ id: item.id, name: item.name, category: 'Custom' });
            return;
        }
        setAddingSkill(true);
        try {
            const r = await axios.post(route('skills.resolve'), { name: item.name });
            selectSkill({ ...r.data.skill, category: r.data.skill.category ?? 'Custom' });
        } catch (error) {
            const payload = (error as { response?: { data?: { errors?: { name?: string[] }; message?: string } } }).response?.data;
            setSkillError(payload?.errors?.name?.[0] ?? payload?.message ?? 'Could not add that skill.');
        } finally {
            setAddingSkill(false);
        }
    }

    const selectedSkillIds = data.skills.map((s) => s.id);

    // Validation rejects an individual pivot row ('skills.0.id'), not the array,
    // so keying off `errors.skills` alone would swallow the message.
    const skillsError = Object.entries(errors)
        .find(([key]) => key === 'skills' || key.startsWith('skills.'))?.[1];

    return (
        <>
            <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                {/* Title with AI autocomplete */}
                <div className="relative">
                    <label className="block text-sm font-medium text-foreground mb-1">Job Title *</label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        onFocus={() => setTitleFocused(true)}
                        onBlur={() => setTimeout(() => setTitleFocused(false), 150)}
                        placeholder="Start typing, e.g. Backend Developer"
                        className={inputClass} />
                    {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                    {titleFocused && (titleLoading || titleSuggestions.length > 0) && data.title.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-card shadow-lg">
                            {titleLoading && titleSuggestions.length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">Suggesting…</p>
                            )}
                            {titleSuggestions.map((title) => (
                                <button key={title} type="button"
                                    onMouseDown={(e) => { e.preventDefault(); setData('title', title); setTitleSuggestions([]); }}
                                    className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
                                    {title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Employment Type *</label>
                        <select value={data.employment_type} onChange={(e) => setData('employment_type', e.target.value)} className={inputClass}>
                            <option value="full_time">Full-time</option>
                            <option value="part_time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                            <option value="freelance">Freelance</option>
                        </select>
                        {errors.employment_type && <p className="mt-1 text-xs text-destructive">{errors.employment_type}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                        <select value={data.status} onChange={(e) => setData('status', e.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                        </select>
                        {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                        <input type="text" value={data.location} onChange={(e) => setData('location', e.target.value)}
                            placeholder="Cebu City" disabled={data.is_remote} className={`${inputClass} disabled:bg-background`} />
                        {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Salary Range</label>
                        <input type="text" value={data.salary_range} onChange={(e) => setData('salary_range', e.target.value)}
                            placeholder="₱20,000 – ₱30,000/mo" className={inputClass} />
                        {errors.salary_range && <p className="mt-1 text-xs text-destructive">{errors.salary_range}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1" htmlFor="application_deadline">Application Deadline</label>
                        <input id="application_deadline" type="date" value={data.application_deadline}
                            onChange={(e) => setData('application_deadline', e.target.value)} className={inputClass} />
                        {errors.application_deadline && <p className="mt-1 text-xs text-destructive">{errors.application_deadline}</p>}
                    </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.is_remote} onChange={(e) => setData('is_remote', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary" />
                    <span className="text-sm text-foreground">Remote position</span>
                </label>
                {errors.is_remote && <p className="text-xs text-destructive">{errors.is_remote}</p>}

                {/* Description with AI generate */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-foreground">Job Description *</label>
                        <button type="button" onClick={generateDescription} disabled={generatingDesc}
                            className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                            {generatingDesc ? 'Generating…' : '✨ Generate from title'}
                        </button>
                    </div>
                    <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={5} className={inputClass} />
                    {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
                </div>

                {/* Qualifications with AI generate */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-foreground">Qualifications</label>
                        <button type="button" onClick={generateQualifications} disabled={generatingQual}
                            className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                            {generatingQual ? 'Generating…' : '✨ Generate from title'}
                        </button>
                    </div>
                    <textarea value={data.qualifications} onChange={(e) => setData('qualifications', e.target.value)} rows={3} className={inputClass} />
                    {errors.qualifications && <p className="mt-1 text-xs text-destructive">{errors.qualifications}</p>}
                </div>

                {genError && <p className="text-xs text-amber-600">{genError}</p>}
            </div>

            {/* Required skills */}
            <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                <p className="text-sm font-medium text-foreground">Required Skills ({data.skills.length} selected)</p>
                {skillsError && <p className="text-xs text-destructive">{skillsError}</p>}

                <div className="relative">
                    <input
                        type="text"
                        value={skillQuery}
                        onChange={(e) => { setSkillQuery(e.target.value); setSkillError(null); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (skillQuery.trim().length >= 2) addSuggestion({ id: null, name: skillQuery.trim(), source: 'typed' });
                            }
                        }}
                        placeholder="Add a skill, e.g. Kubernetes"
                        className={inputClass} />
                    <p className="mt-1 text-xs text-muted-foreground">AI suggests and checks skills so only real ones are added. Press Enter to add what you typed.</p>
                    {skillError && <p className="mt-1 text-xs text-destructive">{skillError}</p>}
                    {(skillLoading || skillSuggestions.length > 0) && skillQuery.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-card shadow-lg">
                            {skillLoading && skillSuggestions.length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                            )}
                            {skillSuggestions.map((item, index) => (
                                <button key={`${item.name}-${index}`} type="button" disabled={addingSkill}
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

                <SkillCategoryPicker skills={skillLibrary} selectedIds={selectedSkillIds} onToggle={toggleSkill} />
            </div>
        </>
    );
}

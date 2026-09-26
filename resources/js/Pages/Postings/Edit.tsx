import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import PostingFormFields, { SetPostingData, Skill, SkillPivot } from './PostingFormFields';

interface PostingSkill extends Skill { pivot: { is_required: boolean; weight: number } }
interface Posting {
    id: number; title: string; description: string; responsibilities: string | null;
    qualifications: string | null; employment_type: string; location: string | null;
    is_remote: boolean; salary_range: string | null; status: string;
    application_deadline: string | null;
    skills: PostingSkill[];
}
interface Props extends PageProps { posting: Posting; skills: Skill[] }

export default function PostingEdit({ posting, skills }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        title: posting.title,
        description: posting.description,
        responsibilities: posting.responsibilities ?? '',
        qualifications: posting.qualifications ?? '',
        employment_type: posting.employment_type,
        location: posting.location ?? '',
        is_remote: posting.is_remote,
        salary_range: posting.salary_range ?? '',
        status: posting.status,
        // The model casts this to a date, so it arrives as a full ISO string;
        // <input type="date"> only accepts the YYYY-MM-DD part.
        application_deadline: posting.application_deadline?.slice(0, 10) ?? '',
        skills: posting.skills.map((s): SkillPivot => ({
            id: s.id, is_required: s.pivot.is_required, weight: s.pivot.weight,
        })),
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        patch(route('postings.update', posting.id));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Edit Posting" />
            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Posting</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <PostingFormFields data={data} setData={setData as unknown as SetPostingData} errors={errors} skills={skills} />

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Save Changes
                        </button>
                        <Link href={route('postings.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">Cancel</Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

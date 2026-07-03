import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import PostingFormFields, { Skill, SkillPivot } from './PostingFormFields';

interface Props extends PageProps { skills: Skill[] }

export default function PostingCreate({ skills }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        responsibilities: '',
        qualifications: '',
        employment_type: 'full_time',
        location: '',
        is_remote: false,
        salary_range: '',
        experience_level: '',
        status: 'open',
        application_deadline: '',
        skills: [] as SkillPivot[],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(route('postings.store'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="New Job Posting" />

            <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-4">
                    <Link href={route('postings.index')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back</Link>
                    <h1 className="text-2xl font-bold text-gray-900">New Job Posting</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <PostingFormFields data={data} setData={setData as (key: string, value: unknown) => void} errors={errors} skills={skills} />

                    <div className="flex gap-3">
                        <button type="submit" disabled={processing}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                            Publish Posting
                        </button>
                        <Link href={route('postings.index')} className="rounded-lg px-6 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

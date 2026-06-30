import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Resume {
    id: number; original_filename: string; size_bytes: number;
    is_primary: boolean; embedding_status: string; created_at: string;
}
interface Props extends PageProps { profile: { id: number }; resumes: Resume[] }

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Resumes({ resumes }: Props) {
    const { flash } = usePage<Props>().props;
    const { data, setData, post, processing, errors, reset } = useForm<{ file: File | null }>({ file: null });

    function handleUpload(e: FormEvent) {
        e.preventDefault();
        if (!data.file) return;
        post(route('resumes.store'), { forceFormData: true, onSuccess: () => reset() });
    }

    function setPrimary(id: number) {
        router.patch(route('resumes.set-primary', id), {}, { preserveScroll: true });
    }
    function deleteResume(id: number, name: string) {
        if (!confirm(`Delete "${name}"?`)) return;
        router.delete(route('resumes.destroy', id), { preserveScroll: true });
    }

    return (
        <AuthenticatedLayout>
            <Head title="My Resumes" />

            <div className="max-w-2xl space-y-5">
                <h1 className="text-2xl font-bold text-gray-900">My Resumes</h1>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                {/* Upload */}
                <form onSubmit={handleUpload} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Upload New Resume</p>
                    <div className="flex gap-3 items-start">
                        <div className="flex-1">
                            <input type="file" accept=".pdf" onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
                            {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                        </div>
                        <button type="submit" disabled={processing || !data.file}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0">
                            Upload
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">PDF only, max 10 MB.</p>
                </form>

                {/* Resume list */}
                <div className="space-y-3">
                    {resumes.map((resume) => (
                        <div key={resume.id} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${resume.is_primary ? 'ring-indigo-400' : 'ring-gray-200'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-gray-900 truncate">{resume.original_filename}</p>
                                        {resume.is_primary && (
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Primary</span>
                                        )}
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[resume.embedding_status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {resume.embedding_status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{formatBytes(resume.size_bytes)} · {new Date(resume.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!resume.is_primary && (
                                        <button onClick={() => setPrimary(resume.id)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                            Set Primary
                                        </button>
                                    )}
                                    <button onClick={() => deleteResume(resume.id, resume.original_filename)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {resumes.length === 0 && (
                        <p className="text-center py-8 text-gray-400">No resumes yet. Upload your first one above.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

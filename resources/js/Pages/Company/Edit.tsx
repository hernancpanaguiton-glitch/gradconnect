import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Company {
    id: number; name: string; industry: string | null; website: string | null;
    description: string | null; location: string | null; is_verified: boolean;
}
interface Props extends PageProps { company: Company | null }

export default function CompanyEdit({ company }: Props) {
    const { flash } = usePage<Props>().props;
    const isNew = !company;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: company?.name ?? '',
        industry: company?.industry ?? '',
        website: company?.website ?? '',
        description: company?.description ?? '',
        location: company?.location ?? '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (isNew) {
            post(route('company.store'));
        } else {
            patch(route('company.update'));
        }
    }

    return (
        <AuthenticatedLayout>
            <Head title="Company Profile" />

            <div className="max-w-xl space-y-5">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
                    {company?.is_verified && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span>
                    )}
                </div>

                {flash?.success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <input type="text" value={data.industry} onChange={(e) => setData('industry', e.target.value)}
                            placeholder="e.g. Information Technology"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input type="url" value={data.website} onChange={(e) => setData('website', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input type="text" value={data.location} onChange={(e) => setData('location', e.target.value)}
                            placeholder="Cebu City, Philippines"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <button type="submit" disabled={processing}
                        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                        {isNew ? 'Create Company' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import {
    REGISTRATION_ROLES,
    ROLE_ADMIN,
    ROLE_DEPARTMENT_HEAD,
    requiresApproval,
    roleLabel,
} from '@/lib/roles';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface College {
    id: number;
    name: string;
    code: string | null;
}

export default function Register({ colleges = [] }: { colleges?: College[] }) {
    // "For Employers" links here, so honour a role named in the query string
    // as long as it is one we actually offer.
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    const initialRole = requestedRole && REGISTRATION_ROLES.includes(requestedRole) ? requestedRole : 'student';

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: initialRole,
        department_id: '',
        consent: false as boolean,
    });

    const needsApproval = requiresApproval(data.role);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="first_name" value="First Name" />

                    <TextInput
                        id="first_name"
                        name="first_name"
                        value={data.first_name}
                        className="mt-1 block w-full"
                        autoComplete="given-name"
                        isFocused={true}
                        onChange={(e) => setData('first_name', e.target.value)}
                        required
                    />

                    <InputError message={errors.first_name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="last_name" value="Last Name" />

                    <TextInput
                        id="last_name"
                        name="last_name"
                        value={data.last_name}
                        className="mt-1 block w-full"
                        autoComplete="family-name"
                        onChange={(e) => setData('last_name', e.target.value)}
                        required
                    />

                    <InputError message={errors.last_name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="role" value="I am registering as" />

                    <select
                        id="role"
                        name="role"
                        value={data.role}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        onChange={(e) => setData('role', e.target.value)}
                        required
                    >
                        {REGISTRATION_ROLES.map((role) => (
                            <option key={role} value={role}>
                                {roleLabel(role)}
                            </option>
                        ))}
                    </select>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {data.role === ROLE_ADMIN
                            ? 'An existing administrator must approve this account, and will verify who you are first.'
                            : needsApproval
                              ? 'Staff and employer accounts are reviewed by an administrator before you can sign in.'
                              : 'You will receive a confirmation email to activate your account.'}
                    </p>

                    <InputError message={errors.role} className="mt-2" />
                </div>

                {/* Only a department head is scoped to one college. */}
                {data.role === ROLE_DEPARTMENT_HEAD && colleges.length > 0 && (
                    <div className="mt-4">
                        <InputLabel htmlFor="department_id" value="College" />

                        <select
                            id="department_id"
                            name="department_id"
                            value={data.department_id}
                            onChange={(e) => setData('department_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">— Select —</option>
                            {colleges.map((college) => (
                                <option key={college.id} value={college.id}>
                                    {college.name}
                                </option>
                            ))}
                        </select>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Optional — an administrator can set or change this when approving your account.
                        </p>

                        <InputError message={errors.department_id} className="mt-2" />
                    </div>
                )}

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-start gap-2">
                        <Checkbox
                            name="consent"
                            checked={data.consent}
                            onChange={(e) => setData('consent', e.target.checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                            I have read and agree to the{' '}
                            <Link href="/privacy" target="_blank" className="text-primary underline hover:text-indigo-800">
                                Privacy Policy
                            </Link>
                            , and consent to the collection and processing of my data as described, in accordance
                            with the Data Privacy Act of 2012 (RA 10173).
                        </span>
                    </label>
                    <InputError message={errors.consent} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

function Logo({ className = 'h-8 w-8' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
            />
        </svg>
    );
}

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
            <Link href="/" className="flex items-center gap-2 text-indigo-600">
                <Logo className="h-9 w-9" />
                <span className="text-2xl font-bold tracking-tight text-gray-900">GradConnect</span>
            </Link>

            <div className="mt-6 w-full overflow-hidden rounded-2xl bg-white px-6 py-8 shadow-sm ring-1 ring-gray-200 sm:max-w-md sm:px-8">
                {children}
            </div>

            <p className="mt-6 text-xs text-gray-400">
                University of Cebu — Lapu-Lapu &amp; Mandaue
            </p>
        </div>
    );
}

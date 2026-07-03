import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f1f3d] to-[#1a56db] px-4 py-10">
            {/* Ambient glow to match the Figma hero */}
            <div className="pointer-events-none absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 right-20 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" aria-hidden="true" />

            <Link href="/" className="relative flex flex-col items-center gap-3 text-white">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <GraduationCap size={28} className="text-white" />
                </span>
            </Link>
            <p className="relative mt-3 text-sm text-blue-200">GradConnect — UCLM Career Platform</p>

            <div className="relative mt-6 w-full overflow-hidden rounded-2xl bg-card px-6 py-8 text-card-foreground shadow-2xl shadow-slate-950/40 sm:max-w-md sm:px-8">
                {children}
            </div>

            <p className="relative mt-6 text-xs text-blue-300/70">
                University of Cebu — Lapu-Lapu &amp; Mandaue
            </p>
        </div>
    );
}

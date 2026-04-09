'use client';

import { Bolt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const COOKIE_NAME = 'pumpme_demo_session';

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleEnterDemo() {
        startTransition(() => {
            document.cookie = `${COOKIE_NAME}=1; path=/; max-age=2592000; samesite=lax`;
            router.push('/');
            router.refresh();
        });
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(209,255,38,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(0,227,253,0.16),_transparent_32%)]" />
            <section className="relative w-full max-w-md rounded-[2rem] border border-white/8 bg-surface-container-low/90 p-8 shadow-ambient backdrop-blur-xl">
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-fixed">
                        <Bolt className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <div>
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">
                            Demo Access
                        </p>
                        <h1 className="font-headline text-3xl font-black italic uppercase tracking-[-0.08em]">
                            PumpMe
                        </h1>
                    </div>
                </div>

                <p className="mb-8 text-sm leading-6 text-on-surface-variant">
                    This build uses a lightweight local demo session. Enter the app to exercise the full UI, including
                    workout logging, calendar history, progress, and profile settings.
                </p>

                <button
                    className="w-full rounded-2xl bg-linear-to-r from-primary to-primary-container px-6 py-4 font-headline text-lg font-black uppercase tracking-[-0.04em] text-on-primary-fixed disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isPending}
                    onClick={handleEnterDemo}
                    type="button"
                >
                    {isPending ? 'Entering Demo' : 'Enter Demo'}
                </button>
            </section>
        </main>
    );
}

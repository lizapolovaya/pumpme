'use client';

import { Activity, Bolt } from 'lucide-react';
import { useState, useTransition } from 'react';
import { startGoogleAuthFlow } from '../../lib/client/auth';
import { getSupabaseBrowserClient } from '../../lib/client/supabase-browser';

type LoginClientProps = {
    nextPath: string;
};

export function LoginClient({ nextPath }: LoginClientProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const isConfigured = Boolean(getSupabaseBrowserClient());

    function handleGoogleLogin() {
        startTransition(() => {
            setError(null);

            void startGoogleAuthFlow(nextPath).catch((nextError) => {
                setError(nextError instanceof Error ? nextError.message : 'Unable to start Google sign-in');
            });
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
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">Google Auth</p>
                        <h1 className="font-headline text-3xl font-black italic uppercase tracking-[-0.08em]">PumpMe</h1>
                    </div>
                </div>

                <p className="mb-8 text-sm leading-6 text-on-surface-variant">
                    Sign in with Google to unlock your PumpMe account and grant activity access so the backend can sync your
                    daily steps from Google fitness data.
                </p>

                <div className="mb-8 rounded-2xl border border-white/8 bg-surface-container-high/80 p-4 text-sm text-on-surface-variant">
                    <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-secondary" strokeWidth={2.1} />
                        <span>Google identity plus fitness consent are requested in one flow.</span>
                    </div>
                </div>

                {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}
                {!isConfigured ? (
                    <p className="mb-4 text-sm text-error">
                        Supabase auth is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
                    </p>
                ) : null}

                <button
                    className="w-full rounded-2xl bg-linear-to-r from-primary to-primary-container px-6 py-4 font-headline text-lg font-black uppercase tracking-[-0.04em] text-on-primary-fixed disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isPending || !isConfigured}
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    {isPending ? 'Redirecting' : 'Continue with Google'}
                </button>
            </section>
        </main>
    );
}


import Link from 'next/link';
import { AppHeader } from '../components/app-header';

export default function HelpPage() {
    return (
        <>
            <AppHeader />
            <main className="mx-auto max-w-3xl space-y-6 px-6 pt-24 pb-24">
                <section className="rounded-[2rem] bg-surface-container-low p-8">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">
                        Support
                    </p>
                    <h1 className="mt-2 font-headline text-4xl font-black italic uppercase tracking-[-0.08em]">
                        Help &amp; FAQ
                    </h1>
                    <div className="mt-6 space-y-5 text-sm leading-6 text-on-surface-variant">
                        <p>Use the Today screen to jump into the current workout, the Workouts screen to log sets, and the Calendar screen to reopen past sessions.</p>
                        <p>Profile settings save through the app APIs. If a save fails, the page shows the backend error inline so you can correct the input.</p>
                        <p>Google sign-in secures your app session. Logging out removes the current Supabase auth session from the browser.</p>
                    </div>
                    <Link className="mt-8 inline-flex text-sm font-bold text-primary" href="/profile">
                        Back to Profile
                    </Link>
                </section>
            </main>
        </>
    );
}

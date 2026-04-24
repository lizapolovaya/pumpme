import Link from 'next/link';
import { AppHeader } from '../components/app-header';

export default function PrivacyPage() {
    return (
        <>
            <AppHeader />
            <main className="mx-auto max-w-3xl space-y-6 px-6 pt-24 pb-24">
                <section className="rounded-[2rem] bg-surface-container-low p-8">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">
                        Policy
                    </p>
                    <h1 className="mt-2 font-headline text-4xl font-black italic uppercase tracking-[-0.08em]">
                        Privacy
                    </h1>
                    <div className="mt-6 space-y-5 text-sm leading-6 text-on-surface-variant">
                        <p>PumpMe stores workout, nutrition, activity, and profile data in the app data layer tied to your authenticated account.</p>
                        <p>Google sign-in is handled through Supabase Auth. If you grant health access, PumpMe may sync daily step totals from the Google Health API into your account.</p>
                        <p>Logging out clears the current browser auth session. Stored account data remains in the configured backend until it is removed separately.</p>
                    </div>
                    <Link className="mt-8 inline-flex text-sm font-bold text-primary" href="/profile">
                        Back to Profile
                    </Link>
                </section>
            </main>
        </>
    );
}

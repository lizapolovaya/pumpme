import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';
import { WorkoutSessionClient } from './workout-session-client';

type WorkoutsPageProps = {
    searchParams?: Promise<{
        activate?: string;
        date?: string;
    }>;
};

function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hasLoggedEntries(session: Parameters<typeof WorkoutSessionClient>[0]['initialSession']): boolean {
    if (session.status === 'completed') {
        return true;
    }

    if (session.totalVolumeKg !== null) {
        return true;
    }

    return session.exercises.some((exercise) =>
        exercise.sets.some(
            (set) =>
                set.completed ||
                set.weightKg !== null ||
                set.reps !== null ||
                set.rpe !== null
        )
    );
}

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
    const params = searchParams ? await searchParams : undefined;
    const { userId } = await resolveCurrentUserContext();
    const services = createBackendServices(userId);
    const today = new Date().toISOString().slice(0, 10);
    const selectedDate = params?.date && isIsoDate(params.date) ? params.date : today;
    const [session, templates] = await Promise.all([
        selectedDate === today
            ? services.workouts.getSessionByDate(today)
            : services.workouts.findSessionByDate(selectedDate),
        services.workouts.listTemplates()
    ]);

    if (!session || (selectedDate !== today && !hasLoggedEntries(session))) {
        return (
            <>
                <AppHeader />

                <main className="mx-auto max-w-md px-6 pt-24 pb-32 md:max-w-2xl">
                    <header className="mb-10 space-y-2">
                        <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                            Workout Log
                        </p>
                        <h1 className="font-headline text-4xl font-black italic uppercase tracking-[-0.08em] text-on-surface">
                            {selectedDate}
                        </h1>
                        <p className="text-sm text-on-surface-variant">
                            No workout entries were logged for this day.
                        </p>
                    </header>

                    <a
                        className="inline-flex rounded-2xl bg-surface-container-high px-6 py-4 font-headline text-sm font-black uppercase tracking-[0.08em] text-primary-container"
                        href="/calendar"
                    >
                        Back to Calendar
                    </a>
                </main>

                <BottomNav active="workouts" />
            </>
        );
    }

    return (
        <>
            <AppHeader />

            <WorkoutSessionClient
                activateOnMount={params?.activate === '1'}
                initialSession={session}
                templates={templates}
            />

            <BottomNav active="workouts" />
        </>
    );
}

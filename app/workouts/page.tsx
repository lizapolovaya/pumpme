'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getTodayIsoDate, workoutsQueryOptions } from '../../lib/client/app-query';
import { WorkoutSessionClient } from './workout-session-client';

function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

type WorkoutSessionLike = Parameters<typeof WorkoutSessionClient>[0]['initialSession'];

function sessionHasLoggedEntries(session: WorkoutSessionLike): boolean {
    if (session.status === 'completed') {
        return true;
    }

    if (session.totalVolumeKg !== null) {
        return true;
    }

    if (session.exercises.length > 0) {
        return true;
    }

    return session.exercises.some((exercise) =>
        exercise.sets.some((set) => set.completed || set.weightKg !== null || set.reps !== null || set.rpe !== null)
    );
}

function WorkoutsPageContent() {
    const searchParams = useSearchParams();
    const todayDate = getTodayIsoDate();
    const rawDate = searchParams.get('date');
    const selectedDate = rawDate && isIsoDate(rawDate) ? rawDate : todayDate;
    const allowEditingCompleted = searchParams.get('edit') === '1';
    const activateOnMount = searchParams.get('activate') === '1';
    const { data, error, isLoading } = useQuery(workoutsQueryOptions(selectedDate, allowEditingCompleted));
    const session = data?.session ?? null;
    const templates = data?.templates ?? [];

    if (isLoading) {
        return <main className="mx-auto max-w-md px-6 pt-24 pb-32 md:max-w-2xl">Loading workout...</main>;
    }

    if (error) {
        return (
            <main className="mx-auto max-w-md px-6 pt-24 pb-32 md:max-w-2xl">
                <p className="text-sm text-error">{error instanceof Error ? error.message : 'Unable to load workout.'}</p>
            </main>
        );
    }

    if (!session || (!allowEditingCompleted && selectedDate !== todayDate && !sessionHasLoggedEntries(session))) {
        return (
            <main className="mx-auto max-w-md px-6 pt-24 pb-32 md:max-w-2xl">
                <header className="mb-10 space-y-2">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                        Workout Log
                    </p>
                    <h1 className="font-headline text-4xl font-black italic uppercase tracking-[-0.08em] text-on-surface">
                        {selectedDate}
                    </h1>
                    <p className="text-sm text-on-surface-variant">No workout entries were logged for this day.</p>
                </header>

                <a
                    className="inline-flex rounded-2xl bg-surface-container-high px-6 py-4 font-headline text-sm font-black uppercase tracking-[0.08em] text-primary-container"
                    href="/calendar"
                >
                    Back to Calendar
                </a>
            </main>
        );
    }

    return (
        <WorkoutSessionClient
            activateOnMount={activateOnMount}
            allowEditingCompleted={allowEditingCompleted}
            initialSession={session}
            queryDate={selectedDate}
            templates={templates}
        />
    );
}

export default function WorkoutsPage() {
    return (
        <Suspense fallback={<main className="mx-auto max-w-md px-6 pt-24 pb-32 md:max-w-2xl">Loading workout...</main>}>
            <WorkoutsPageContent />
        </Suspense>
    );
}

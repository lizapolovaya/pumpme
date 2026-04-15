'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { WorkoutSessionDto } from '../../lib/server/backend/types';

type RerunSessionButtonProps = {
    selectedSession: WorkoutSessionDto | null;
};

export function RerunSessionButton({ selectedSession }: RerunSessionButtonProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        if (!selectedSession) {
            return;
        }

        startTransition(async () => {
            setError(null);

            try {
                const today = new Date().toISOString().slice(0, 10);
                const createResponse = await fetch('/api/workouts/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: today,
                        focus: selectedSession.focus,
                        title: selectedSession.title
                    })
                });

                if (!createResponse.ok) {
                    throw new Error('Unable to start the rerun session');
                }

                const nextSession = (await createResponse.json()) as WorkoutSessionDto;

                for (const exercise of selectedSession.exercises) {
                    const addExerciseResponse = await fetch(`/api/workouts/sessions/${nextSession.id}/exercises`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            exerciseId: exercise.exerciseId,
                            exerciseName: exercise.exerciseName
                        })
                    });

                    if (!addExerciseResponse.ok) {
                        throw new Error(`Unable to add ${exercise.exerciseName}`);
                    }
                }

                router.push('/workouts?activate=1');
            } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Unable to rerun this session');
            }
        });
    }

    return (
        <div className="flex-1 space-y-2">
            <button
                className="w-full rounded-xl bg-primary-container py-3 font-headline text-sm font-black italic uppercase tracking-[-0.04em] text-on-primary-fixed transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedSession || isPending}
                onClick={handleClick}
                type="button"
            >
                {isPending ? 'Building Session' : 'Re-Run Session'}
            </button>
            {error ? <p className="text-sm text-error">{error}</p> : null}
        </div>
    );
}

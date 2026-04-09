'use client';

import {
    Activity,
    CirclePlus,
    Dumbbell,
    PencilLine,
    Scale,
    Trash2,
    TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { WorkoutSessionDto, WorkoutTemplateDto } from '../../lib/server/backend/types';

type WorkoutSessionClientProps = {
    activateOnMount: boolean;
    initialSession: WorkoutSessionDto;
    templates: WorkoutTemplateDto[];
};

type SaveState = {
    error: string | null;
    message: string | null;
};

const statCards = [
    {
        label: 'Estimated Burn',
        metric: 'burn' as const,
        unit: 'KCAL',
        accent: 'text-primary-container',
        icon: Activity
    },
    {
        label: 'Total Volume',
        metric: 'volume' as const,
        unit: 'KG',
        accent: 'text-secondary',
        icon: Scale
    }
] as const;

function slugifyExerciseName(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-exercise';
}

function getSessionVolume(session: WorkoutSessionDto): number {
    return session.exercises.reduce(
        (sum, exercise) =>
            sum +
            exercise.sets.reduce((exerciseSum, set) => {
                return exerciseSum + (set.weightKg ?? 0) * (set.reps ?? 0);
            }, 0),
        0
    );
}

function getEstimatedBurn(session: WorkoutSessionDto): number {
    if (session.estimatedBurnKcal) {
        return session.estimatedBurnKcal;
    }

    const setCount = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const durationMinutes = session.durationMinutes ?? Math.max(30, setCount * 3);
    return Math.round(durationMinutes * 4.5);
}

export function WorkoutSessionClient({
    activateOnMount,
    initialSession,
    templates
}: WorkoutSessionClientProps) {
    const router = useRouter();
    const [session, setSession] = useState(initialSession);
    const [saveState, setSaveState] = useState<SaveState>({
        error: null,
        message: null
    });
    const [isPending, startTransition] = useTransition();
    const isCompleted = session.status === 'completed';

    async function requestSession(
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<WorkoutSessionDto> {
        const response = await fetch(input, init);

        if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? 'Request failed');
        }

        return response.json() as Promise<WorkoutSessionDto>;
    }

    function handleMutation(action: () => Promise<WorkoutSessionDto>, successMessage: string) {
        startTransition(async () => {
            setSaveState({
                error: null,
                message: null
            });

            try {
                const nextSession = await action();
                setSession(nextSession);
                setSaveState({
                    error: null,
                    message: successMessage
                });
                router.refresh();
            } catch (error) {
                setSaveState({
                    error: error instanceof Error ? error.message : 'Unable to update workout',
                    message: null
                });
            }
        });
    }

    useEffect(() => {
        if (!activateOnMount || session.status !== 'scheduled') {
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'active'
                    })
                }),
            'Workout started.'
        );
    }, [activateOnMount, session.id, session.status]);

    function handleRenameWorkout() {
        const nextTitle = window.prompt('Workout title', session.title);

        if (!nextTitle || nextTitle.trim() === session.title) {
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: nextTitle.trim()
                    })
                }),
            'Workout title updated.'
        );
    }

    function handleExerciseAction(exerciseId: string, exerciseName: string) {
        const nextName = window.prompt('Rename exercise. Leave empty to remove it.', exerciseName);

        if (nextName === null) {
            return;
        }

        if (nextName.trim().length === 0) {
            if (!window.confirm(`Remove ${exerciseName}?`)) {
                return;
            }

            handleMutation(
                () =>
                    requestSession(`/api/workouts/sessions/${session.id}/exercises/${exerciseId}`, {
                        method: 'DELETE'
                    }),
                `${exerciseName} removed.`
            );
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/exercises/${exerciseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        exerciseName: nextName.trim()
                    })
                }),
            'Exercise updated.'
        );
    }

    function handleSetChange(
        setId: string,
        field: 'weightKg' | 'reps' | 'rpe',
        value: string
    ) {
        const trimmed = value.trim();
        const parsedValue = trimmed.length === 0 ? null : Number(trimmed);

        if (trimmed.length > 0 && Number.isNaN(parsedValue)) {
            setSaveState({
                error: 'Set values must be numeric.',
                message: null
            });
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/sets/${setId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        [field]: parsedValue,
                        completed: true
                    })
                }),
            'Set updated.'
        );
    }

    function handleAddSet(exerciseRowId: string) {
        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/sets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        exerciseRowId
                    })
                }),
            'Set added.'
        );
    }

    function handleRemoveSet(setId: string) {
        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/sets/${setId}`, {
                    method: 'DELETE'
                }),
            'Set removed.'
        );
    }

    function handleAddExercise() {
        const availableTemplates = templates.find((template) => template.id === session.templateId);
        const suggestedExercises = availableTemplates?.exercises.map((exercise) => exercise.exerciseName).join(', ');
        const promptText = suggestedExercises
            ? `Exercise name. Suggested: ${suggestedExercises}`
            : 'Exercise name';
        const exerciseName = window.prompt(promptText, '');

        if (!exerciseName || exerciseName.trim().length === 0) {
            return;
        }

        const trimmedName = exerciseName.trim();

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/exercises`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        exerciseId: slugifyExerciseName(trimmedName),
                        exerciseName: trimmedName
                    })
                }),
            'Exercise added.'
        );
    }

    function handleFinishWorkout() {
        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/finish`, {
                    method: 'POST'
                }),
            'Workout finished.'
        );
    }

    const volume = getSessionVolume(session);
    const estimatedBurn = getEstimatedBurn(session);

    return (
        <main className="mx-auto max-w-md px-4 pt-24 pb-32 md:max-w-2xl">
            <header className="mb-8">
                <p className="mb-1 font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                    {new Intl.DateTimeFormat('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC'
                    }).format(new Date(`${session.date}T00:00:00.000Z`))}
                </p>
                <div className="flex items-center gap-3">
                    <h1 className="flex items-center gap-3 font-headline text-4xl font-black italic tracking-[-0.08em] text-on-surface">
                        {session.title}
                        <button
                            className="text-primary-container disabled:opacity-50"
                            disabled={isCompleted || isPending}
                            onClick={handleRenameWorkout}
                            type="button"
                        >
                            <PencilLine className="h-5 w-5" strokeWidth={2.3} />
                        </button>
                    </h1>
                    <span className="rounded-full border border-outline-variant/20 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {session.status}
                    </span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">
                    {session.focus ?? 'Training session'}
                </p>
            </header>

            <section className="mb-4 space-y-2">
                {saveState.error ? <p className="text-sm text-error">{saveState.error}</p> : null}
                {saveState.message ? <p className="text-sm text-primary-dim">{saveState.message}</p> : null}
            </section>

            <section className="mb-8 grid grid-cols-2 gap-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    const value = card.metric === 'burn' ? estimatedBurn : volume;

                    return (
                        <article
                            key={card.label}
                            className="group relative overflow-hidden rounded-xl bg-surface-container-high p-5"
                        >
                            <div className="absolute -top-4 -right-4 opacity-10 transition-opacity group-hover:opacity-20">
                                <Icon className="h-20 w-20" strokeWidth={1.5} />
                            </div>
                            <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                {card.label}
                            </span>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className={`font-headline text-3xl font-extrabold ${card.accent}`}>
                                    {Math.round(value).toLocaleString('en-US')}
                                </span>
                                <span className="font-label text-sm font-medium text-on-surface-variant">
                                    {card.unit}
                                </span>
                            </div>
                        </article>
                    );
                })}
            </section>

            <div className="space-y-6">
                {session.exercises.map((exercise) => {
                    const Icon = exercise.exerciseName.toLowerCase().includes('press') ? Dumbbell : TrendingUp;

                    return (
                        <section
                            key={exercise.id}
                            className="overflow-hidden rounded-xl border-l-4 border-primary-container bg-surface-container-low"
                        >
                            <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest text-primary-container">
                                        <Icon className="h-4 w-4" strokeWidth={2.1} />
                                    </div>
                                    <h3 className="font-headline text-xl font-bold text-on-surface">
                                        {exercise.exerciseName}
                                    </h3>
                                </div>
                                <button
                                    className="text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
                                    disabled={isCompleted || isPending}
                                    onClick={() => handleExerciseAction(exercise.id, exercise.exerciseName)}
                                    type="button"
                                >
                                    <PencilLine className="h-4 w-4" strokeWidth={2.1} />
                                </button>
                            </div>

                            <div className="px-5 pb-5">
                                <div className="mb-3 grid grid-cols-12 gap-2 px-2">
                                    <div className="col-span-2 font-label text-[10px] font-bold uppercase text-on-surface-variant">Set</div>
                                    <div className="col-span-3 font-label text-[10px] font-bold uppercase text-on-surface-variant">Weight Kg</div>
                                    <div className="col-span-3 font-label text-[10px] font-bold uppercase text-on-surface-variant">Reps</div>
                                    <div className="col-span-3 text-right font-label text-[10px] font-bold uppercase text-on-surface-variant">RPE</div>
                                    <div className="col-span-1 text-right font-label text-[10px] font-bold uppercase text-on-surface-variant">Del</div>
                                </div>

                                <div className="space-y-2">
                                    {exercise.sets.map((set) => (
                                        <div
                                            key={set.id}
                                            className="grid grid-cols-12 items-center gap-2 rounded-lg bg-surface-container-lowest/50 p-2"
                                        >
                                            <div className="col-span-2 font-label font-bold text-on-surface-variant">
                                                {set.order}
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                                                    defaultValue={set.weightKg ?? ''}
                                                    disabled={isCompleted || isPending}
                                                    onBlur={(event) => handleSetChange(set.id, 'weightKg', event.target.value)}
                                                    type="number"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                                                    defaultValue={set.reps ?? ''}
                                                    disabled={isCompleted || isPending}
                                                    onBlur={(event) => handleSetChange(set.id, 'reps', event.target.value)}
                                                    type="number"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                                                    defaultValue={set.rpe ?? ''}
                                                    disabled={isCompleted || isPending}
                                                    max="10"
                                                    min="1"
                                                    onBlur={(event) => handleSetChange(set.id, 'rpe', event.target.value)}
                                                    step="0.5"
                                                    type="number"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button
                                                    className="text-error disabled:opacity-40"
                                                    disabled={isCompleted || isPending}
                                                    onClick={() => handleRemoveSet(set.id)}
                                                    type="button"
                                                >
                                                    <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant py-3 font-label text-sm font-bold text-on-surface-variant transition-all hover:border-primary-container/50 hover:bg-primary-container/5 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isCompleted || isPending}
                                    onClick={() => handleAddSet(exercise.id)}
                                    type="button"
                                >
                                    <CirclePlus className="h-4 w-4" strokeWidth={2.1} />
                                    Add Set
                                </button>
                            </div>
                        </section>
                    );
                })}
            </div>

            <button
                className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-high py-5 font-headline font-bold text-primary-container transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCompleted || isPending}
                onClick={handleAddExercise}
                type="button"
            >
                <span className="rounded-full bg-primary-container p-1 text-on-primary-fixed transition-transform group-hover:rotate-90">
                    <CirclePlus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                Add Exercise
            </button>

            <div className="mt-12 mb-10">
                <button
                    className="w-full rounded-xl bg-linear-to-br from-primary to-primary-container py-4 font-headline text-lg font-black uppercase tracking-[0.08em] text-on-primary-fixed shadow-lg shadow-primary-container/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isCompleted || isPending}
                    onClick={handleFinishWorkout}
                    type="button"
                >
                    {isCompleted ? 'Workout Complete' : 'Finish Workout'}
                </button>
            </div>
        </main>
    );
}

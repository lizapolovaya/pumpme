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
import { useEffect, useState, useTransition } from 'react';
import { getSupabaseBrowserClient } from '../../lib/client/supabase-browser';
import type { WorkoutSessionDto, WorkoutTemplateDto } from '../../lib/server/backend/types';

type WorkoutSessionClientProps = {
    activateOnMount: boolean;
    allowEditingCompleted?: boolean;
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

function createExerciseIdFromName(exerciseName: string): string {
    return `exercise-${slugifyExerciseName(exerciseName)}`;
}

function sanitizeWeightInput(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const [wholePart = '', ...decimalParts] = normalized.split('.');
    const decimals = decimalParts.join('').slice(0, 2);
    const clampedWhole = wholePart.slice(0, 4);

    if (normalized.includes('.')) {
        return `${clampedWhole}.${decimals}`;
    }

    return clampedWhole;
}

function sanitizeRepsInput(value: string): string {
    return value.replace(/\D/g, '').slice(0, 2);
}

function sanitizeRpeInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    if (!digits) {
        return '';
    }

    const parsed = Number(digits);
    if (parsed <= 0) {
        return '1';
    }

    return String(Math.min(parsed, 10));
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
    allowEditingCompleted = false,
    initialSession,
    templates
}: WorkoutSessionClientProps) {
    const [session, setSession] = useState(initialSession);
    const [saveState, setSaveState] = useState<SaveState>({
        error: null,
        message: null
    });
    const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
    const [exerciseDraftName, setExerciseDraftName] = useState('');
    const [isPending, startTransition] = useTransition();
    const isCompleted = session.status === 'completed';
    const isReadOnly = isPending || (isCompleted && !allowEditingCompleted);

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

    function handleMutation(
        action: () => Promise<WorkoutSessionDto>,
        successMessage: string,
        afterSuccess?: (nextSession: WorkoutSessionDto) => void
    ) {
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
                afterSuccess?.(nextSession);
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

    useEffect(() => {
        const client = getSupabaseBrowserClient();
        if (!client) {
            return;
        }

        let isActive = true;
        let syncTimeout: ReturnType<typeof setTimeout> | null = null;
        const exerciseIds = new Set(session.exercises.map((exercise) => exercise.id));

        const syncSession = () => {
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            syncTimeout = setTimeout(async () => {
                try {
                    const nextSession = await requestSession(`/api/workouts/sessions/${session.id}`);
                    if (isActive) {
                        setSession(nextSession);
                    }
                } catch {
                    return;
                }
            }, 120);
        };

        const handleSetChange = (payload: { new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
            const row = payload.new ?? payload.old;
            const sessionExerciseId = typeof row?.session_exercise_id === 'string' ? row.session_exercise_id : null;

            if (sessionExerciseId && exerciseIds.has(sessionExerciseId)) {
                syncSession();
            }
        };

        const channel = client
            .channel(`workout-session:${session.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'workout_sessions',
                filter: `id=eq.${session.id}`
            }, syncSession)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'workout_session_exercises',
                filter: `session_id=eq.${session.id}`
            }, syncSession)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'workout_sets'
            }, handleSetChange)
            .subscribe();

        return () => {
            isActive = false;
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            client.removeChannel(channel);
        };
    }, [session.id, session.exercises]);

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

    function handleDeleteExercise(exerciseId: string, exerciseName: string) {
        if (!window.confirm(`Delete ${exerciseName}?`)) {
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/exercises/${exerciseId}`, {
                    method: 'DELETE'
                }),
            `${exerciseName} removed.`
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

    function handleAddExerciseOpen() {
        setSaveState({
            error: null,
            message: null
        });
        setExerciseDraftName('');
        setIsAddExerciseOpen(true);
    }

    function handleAddExerciseClose() {
        setIsAddExerciseOpen(false);
        setExerciseDraftName('');
    }

    function submitAddExercise(exerciseId: string, rawExerciseName: string) {
        const trimmedName = rawExerciseName.trim();

        if (!trimmedName) {
            setSaveState({
                error: 'Exercise name is required.',
                message: null
            });
            return;
        }

        handleMutation(
            () =>
                requestSession(`/api/workouts/sessions/${session.id}/exercises`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        exerciseId,
                        exerciseName: trimmedName
                    })
                }),
            'Exercise added.',
            () => {
                handleAddExerciseClose();
            }
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
                            disabled={isReadOnly}
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
                                <div className="flex items-center gap-2">
                                    <button
                                        aria-label={`Rename ${exercise.exerciseName}`}
                                        className="text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
                                        disabled={isReadOnly}
                                        onClick={() => handleExerciseAction(exercise.id, exercise.exerciseName)}
                                        type="button"
                                    >
                                        <PencilLine className="h-4 w-4" strokeWidth={2.1} />
                                    </button>
                                    <button
                                        aria-label={`Delete ${exercise.exerciseName}`}
                                        className="text-error transition-colors hover:text-error/80 disabled:opacity-50"
                                        disabled={isReadOnly}
                                        onClick={() => handleDeleteExercise(exercise.id, exercise.exerciseName)}
                                        type="button"
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                                    </button>
                                </div>
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
                                                    disabled={isReadOnly}
                                                    inputMode="numeric"
                                                    onBlur={(event) => handleSetChange(set.id, 'weightKg', sanitizeWeightInput(event.target.value))}
                                                    onInput={(event) => {
                                                        event.currentTarget.value = sanitizeWeightInput(event.currentTarget.value);
                                                    }}
                                                    pattern="[0-9]+([.][0-9]{0,2})?"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                                                    defaultValue={set.reps ?? ''}
                                                    disabled={isReadOnly}
                                                    inputMode="numeric"
                                                    maxLength={2}
                                                    onBlur={(event) => handleSetChange(set.id, 'reps', sanitizeRepsInput(event.target.value))}
                                                    onInput={(event) => {
                                                        event.currentTarget.value = sanitizeRepsInput(event.currentTarget.value);
                                                    }}
                                                    pattern="[0-9]*"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                                                    defaultValue={set.rpe ?? ''}
                                                    disabled={isReadOnly}
                                                    inputMode="numeric"
                                                    maxLength={2}
                                                    onBlur={(event) => handleSetChange(set.id, 'rpe', sanitizeRpeInput(event.target.value))}
                                                    onInput={(event) => {
                                                        event.currentTarget.value = sanitizeRpeInput(event.currentTarget.value);
                                                    }}
                                                    pattern="[0-9]*"
                                                    type="text"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button
                                                    className="text-error disabled:opacity-40"
                                                    disabled={isReadOnly}
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
                                    disabled={isReadOnly}
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
                disabled={isReadOnly}
                onClick={handleAddExerciseOpen}
                type="button"
            >
                <span className="rounded-full bg-primary-container p-1 text-on-primary-fixed transition-transform group-hover:rotate-90">
                    <CirclePlus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                Add Exercise
            </button>

            {isAddExerciseOpen ? (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 px-4 pb-8 pt-24 backdrop-blur-sm md:items-center md:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Add exercise"
                >
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low shadow-ambient">
                        <div className="border-b border-outline-variant/10 p-6">
                            <h2 className="font-headline text-2xl font-black italic uppercase tracking-[-0.06em]">
                                Add Exercise
                            </h2>
                            <p className="mt-1 text-sm text-on-surface-variant">
                                Add a movement to today’s session.
                            </p>
                        </div>

                        <form
                            className="space-y-5 p-6"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        submitAddExercise(createExerciseIdFromName(exerciseDraftName), exerciseDraftName);
                                    }}
                        >
                            <div className="space-y-2">
                                <label
                                    className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant"
                                    htmlFor="exerciseName"
                                >
                                    Exercise Name
                                </label>
                                <input
                                    id="exerciseName"
                                    className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 font-body font-semibold text-on-surface outline-none focus:border-primary-dim/60 focus:ring-1 focus:ring-primary-dim/30"
                                    autoFocus
                                    disabled={isPending}
                                    onChange={(event) => setExerciseDraftName(event.target.value)}
                                    placeholder="e.g. Lat Pulldown"
                                    type="text"
                                    value={exerciseDraftName}
                                />
                            </div>

                            {session.templateId ? (
                                <div className="space-y-2">
                                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                                        Suggested
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {templates
                                            .find((template) => template.id === session.templateId)
                                            ?.exercises.filter(
                                                (exercise) =>
                                                    !session.exercises.some(
                                                        (sessionExercise) =>
                                                            sessionExercise.exerciseName.toLowerCase() ===
                                                            exercise.exerciseName.toLowerCase()
                                                    )
                                            )
                                            .slice(0, 6)
                                            .map((exercise) => (
                                                <button
                                                    key={exercise.id}
                                                    className="rounded-full border border-outline-variant/20 bg-surface-container-highest px-3 py-1.5 text-sm font-semibold text-on-surface transition hover:border-primary-dim/50 hover:text-primary-dim disabled:opacity-60"
                                                    disabled={isPending}
                                                    onClick={() => submitAddExercise(exercise.exerciseId, exercise.exerciseName)}
                                                    type="button"
                                                >
                                                    {exercise.exerciseName}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex gap-3 pt-2">
                                <button
                                    className="flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 font-headline text-sm font-black uppercase tracking-[0.08em] text-on-surface-variant transition hover:bg-surface-bright disabled:opacity-60"
                                    disabled={isPending}
                                    onClick={handleAddExerciseClose}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 rounded-2xl bg-linear-to-br from-primary to-primary-container px-4 py-3 font-headline text-sm font-black uppercase tracking-[0.08em] text-on-primary-fixed shadow-lg shadow-primary-container/20 transition active:scale-95 disabled:opacity-60"
                                    disabled={isPending}
                                    type="submit"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

        </main>
    );
}

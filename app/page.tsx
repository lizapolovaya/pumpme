'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { getTodayIsoDate, queryKeys, todayQueryOptions } from '../lib/client/app-query';
import type { BootstrapResponse, NutritionDayDto, ProfileBootstrapResponse } from '../lib/server/backend/types';
import { StartWorkoutButton } from './components/start-workout-button';

const circumference = 2 * Math.PI * 40;
const macroTones = {
    protein: 'bg-primary-dim',
    carbs: 'bg-secondary',
    fats: 'bg-tertiary',
    calories: 'bg-primary'
} as const;

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

function formatMacroValue(value: number, unit: string): string {
    return `${Math.round(value)}${unit}`;
}

function getMacroWidth(current: number, target: number): string {
    if (target <= 0) {
        return '0%';
    }

    return `${Math.min(100, Math.max(0, Math.round((current / target) * 100)))}%`;
}

function getDisciplineHeight(sessionCount: number, completed: boolean): string {
    if (!sessionCount) {
        return 'h-2';
    }

    if (completed && sessionCount > 1) {
        return 'h-14';
    }

    if (completed) {
        return 'h-10';
    }

    return 'h-6';
}

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function sanitizeIntegerInput(value: string): string {
    return value.replace(/\D/g, '');
}

function asInputValue(value: number): string {
    return String(Math.round(value));
}

export default function Home() {
    const queryClient = useQueryClient();
    const today = new Date();
    const todayDate = getTodayIsoDate();
    const { data, error, isLoading } = useQuery(todayQueryOptions(todayDate));
    const [isEditingNutrition, setIsEditingNutrition] = useState(false);
    const [caloriesInput, setCaloriesInput] = useState('');
    const [proteinInput, setProteinInput] = useState('');
    const [carbsInput, setCarbsInput] = useState('');
    const [fatsInput, setFatsInput] = useState('');
    const [nutritionFeedback, setNutritionFeedback] = useState<string | null>(null);
    const [nutritionError, setNutritionError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const dashboard = data?.today;

    if (isLoading || !dashboard) {
        return <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-24 pb-32 md:max-w-5xl">Loading dashboard...</main>;
    }

    if (error) {
        return (
            <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-24 pb-32 md:max-w-5xl">
                <p className="text-sm text-error">{error instanceof Error ? error.message : 'Unable to load dashboard.'}</p>
            </main>
        );
    }

    const readinessScore = dashboard.readiness.score ?? 0;
    const readinessOffset = circumference - (readinessScore / 100) * circumference;
    const planStats = [
        [
            'Est. Duration',
            dashboard.plannedWorkout.estimatedDurationMinutes ? `${dashboard.plannedWorkout.estimatedDurationMinutes} MIN` : 'TBD'
        ],
        [
            'Target Volume',
            dashboard.plannedWorkout.targetVolumeKg
                ? `${Math.round(dashboard.plannedWorkout.targetVolumeKg).toLocaleString('en-US')} KG`
                : 'TBD'
        ]
    ] as const;
    const currentNutrition = dashboard.nutrition;
    const macros = [currentNutrition.protein, currentNutrition.carbs, currentNutrition.fats];
    const activeDays = dashboard.weeklyDiscipline.filter((day) => day.completed).length;
    const hasCalculatedTargets = currentNutrition.calories.target > 0;

    useEffect(() => {
        setCaloriesInput(asInputValue(currentNutrition.calories.current));
        setProteinInput(asInputValue(currentNutrition.protein.current));
        setCarbsInput(asInputValue(currentNutrition.carbs.current));
        setFatsInput(asInputValue(currentNutrition.fats.current));
    }, [
        currentNutrition.calories.current,
        currentNutrition.carbs.current,
        currentNutrition.fats.current,
        currentNutrition.protein.current
    ]);

    async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
        const response = await fetch(input, init);

        if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? 'Request failed');
        }

        return response.json() as Promise<T>;
    }

    function handleCancelNutritionEdit() {
        setIsEditingNutrition(false);
        setNutritionError(null);
        setNutritionFeedback(null);
        setCaloriesInput(asInputValue(currentNutrition.calories.current));
        setProteinInput(asInputValue(currentNutrition.protein.current));
        setCarbsInput(asInputValue(currentNutrition.carbs.current));
        setFatsInput(asInputValue(currentNutrition.fats.current));
    }

    function handleSaveNutrition() {
        startTransition(async () => {
            setNutritionError(null);
            setNutritionFeedback(null);

            try {
                const updatedNutrition = await requestJson<NutritionDayDto>(`/api/nutrition/today?date=${todayDate}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        caloriesCurrent: Number(caloriesInput || '0'),
                        carbsCurrent: Number(carbsInput || '0'),
                        fatsCurrent: Number(fatsInput || '0'),
                        proteinCurrent: Number(proteinInput || '0')
                    })
                });

                queryClient.setQueryData(queryKeys.today(todayDate), (current: BootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              today: {
                                  ...current.today,
                                  nutrition: updatedNutrition
                              }
                          }
                        : current
                );
                queryClient.setQueryData(queryKeys.profile(todayDate), (current: ProfileBootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              nutrition: updatedNutrition
                          }
                        : current
                );
                setNutritionFeedback('Nutrition intake saved.');
                setIsEditingNutrition(false);
            } catch (nextError) {
                setNutritionError(nextError instanceof Error ? nextError.message : 'Unable to save nutrition.');
            }
        });
    }

    return (
        <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-24 pb-32 md:max-w-5xl">
            <section className="space-y-6">
                <div className="space-y-2">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary-dim">
                        Performance Pulse
                    </p>
                    <h2 className="font-headline text-5xl leading-[0.88] font-black italic tracking-[-0.14em] md:text-7xl">
                        READY TO
                        <br />
                        <span className="text-white/20">TRAIN?</span>
                    </h2>
                </div>

                <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/3 p-6 shadow-ambient backdrop-blur-xl">
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#c1ed00"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={readinessOffset}
                                    className="drop-shadow-[0_0_8px_rgba(209,255,38,0.4)]"
                                />
                            </svg>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <strong className="font-headline text-4xl leading-none font-black italic tracking-[-0.12em]">
                                    {readinessScore}
                                </strong>
                                <span className="mt-0.5 font-label text-[8px] font-bold uppercase tracking-[0.24em] text-primary-dim">
                                    {dashboard.readiness.headline}
                                </span>
                            </div>
                        </div>
                        <div className="z-10 space-y-1 text-left">
                            <h3 className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                                Readiness
                                <br />
                                Score
                            </h3>
                            <p className="max-w-xs text-sm text-on-surface-variant">
                                {dashboard.readiness.summary}
                            </p>
                        </div>
                    </div>
                    <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
                </article>
            </section>

            <section>
                <StartWorkoutButton
                    date={todayDate}
                    focus={dashboard.plannedWorkout.focus}
                    sessionId={dashboard.plannedWorkout.sessionId}
                    sessionStatus={dashboard.plannedWorkout.status}
                    title={dashboard.plannedWorkout.title}
                />
            </section>

            <section className="grid gap-6 md:grid-cols-2">
                <article className="rounded-xl bg-surface-container-low p-6 md:col-span-2">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">
                                Weekly Discipline
                            </p>
                            <h3 className="mt-1 font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                                Consistency
                                <br />
                                Streak
                            </h3>
                        </div>
                        <div className="text-right">
                            <span className="block font-headline text-2xl font-black italic text-primary-dim">{activeDays}/7</span>
                            <span className="block font-label text-[10px] font-bold uppercase text-on-surface-variant">
                                Days Active
                            </span>
                        </div>
                    </div>

                    <div className="flex h-16 items-end justify-between gap-2">
                        {dashboard.weeklyDiscipline.map((day) => (
                            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                                <div
                                    className={`w-full rounded-full ${getDisciplineHeight(day.sessionCount, day.completed)} ${
                                        day.completed ? 'bg-primary-dim shadow-[0_0_15px_rgba(209,255,38,0.5)]' : 'bg-white/10'
                                    }`}
                                />
                                <span
                                    className={`font-label text-[10px] font-bold ${
                                        day.completed ? 'text-on-surface' : 'text-on-surface-variant'
                                    }`}
                                >
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="relative overflow-hidden rounded-xl bg-surface-container-low p-6">
                    <div className="absolute inset-y-0 left-0 w-1 bg-secondary shadow-[0_0_16px_rgba(0,227,253,0.5)]" />
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">
                                Planned Routine
                            </p>
                            <h3 className="mt-1 font-headline text-3xl font-black tracking-[-0.08em]">
                                {dashboard.plannedWorkout.title.toUpperCase()}
                            </h3>
                            <p className="mt-1 text-sm italic text-on-surface-variant">
                                {dashboard.plannedWorkout.focus ?? formatDate(today)}
                            </p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-secondary" strokeWidth={2.4} />
                    </div>
                    <dl className="space-y-4 text-sm">
                        {planStats.map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-4">
                                <dt className="text-on-surface-variant">{label}</dt>
                                <dd className="font-label font-bold">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </article>

                <article className="rounded-xl bg-surface-container-low p-6">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-tertiary">
                                Fuel Intake
                            </p>
                            <h3 className="mt-1 font-headline text-3xl font-black tracking-[-0.08em]">
                                NUTRITION
                            </h3>
                        </div>
                        <div className="text-right">
                            <strong className="block font-label text-2xl font-black">
                                {Math.max(
                                    0,
                                    Math.round(dashboard.nutrition.calories.target - dashboard.nutrition.calories.current)
                                ).toLocaleString('en-US')}
                            </strong>
                            <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                kcal left
                            </span>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            {nutritionFeedback ? <p className="text-sm text-primary-dim">{nutritionFeedback}</p> : null}
                            {nutritionError ? <p className="text-sm text-error">{nutritionError}</p> : null}
                            {!hasCalculatedTargets ? (
                                <p className="text-sm text-on-surface-variant">
                                    Complete your profile metrics in Settings to calculate personalized targets.
                                </p>
                            ) : null}
                        </div>
                        {!isEditingNutrition ? (
                            <button
                                className="rounded-xl border border-outline-variant/20 bg-surface-container-highest px-4 py-2 font-headline text-xs font-black uppercase tracking-[0.08em] text-on-surface transition hover:bg-surface-bright"
                                onClick={() => {
                                    setNutritionFeedback(null);
                                    setNutritionError(null);
                                    setIsEditingNutrition(true);
                                }}
                                type="button"
                            >
                                Edit Intake
                            </button>
                        ) : null}
                    </div>

                    {isEditingNutrition ? (
                        <div className="mb-6 grid gap-3 sm:grid-cols-2">
                            {[
                                { label: 'Calories', setter: setCaloriesInput, unit: 'kcal', value: caloriesInput },
                                { label: 'Protein', setter: setProteinInput, unit: 'g', value: proteinInput },
                                { label: 'Carbs', setter: setCarbsInput, unit: 'g', value: carbsInput },
                                { label: 'Fats', setter: setFatsInput, unit: 'g', value: fatsInput }
                            ].map(({ label, setter, unit, value }) => (
                                <label
                                    key={label}
                                    className="space-y-2 rounded-2xl bg-surface-container-highest p-4"
                                >
                                    <span className="block font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            className="w-full border-none bg-transparent font-headline text-2xl font-black text-on-surface focus:ring-0"
                                            inputMode="numeric"
                                            onChange={(event) => setter(sanitizeIntegerInput(event.target.value))}
                                            type="text"
                                            value={value}
                                        />
                                        <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                            {unit}
                                        </span>
                                    </div>
                                </label>
                            ))}
                            <div className="sm:col-span-2 flex gap-3">
                                <button
                                    className="flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 font-headline text-sm font-black uppercase tracking-[0.08em] text-on-surface-variant transition hover:bg-surface-bright"
                                    disabled={isPending}
                                    onClick={handleCancelNutritionEdit}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 rounded-2xl bg-linear-to-br from-primary to-primary-container px-4 py-3 font-headline text-sm font-black uppercase tracking-[0.08em] text-on-primary-fixed transition active:scale-95 disabled:opacity-60"
                                    disabled={isPending}
                                    onClick={handleSaveNutrition}
                                    type="button"
                                >
                                    {isPending ? 'Saving' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        {macros.map((macro) => (
                            <div key={macro.key} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-4 font-label text-[11px] font-bold uppercase tracking-[0.14em]">
                                    <span className="text-on-surface-variant">{toTitleCase(macro.key)}</span>
                                    <strong>
                                        {formatMacroValue(macro.current, macro.unit)} / {formatMacroValue(macro.target, macro.unit)}
                                    </strong>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                                    <div
                                        className={`h-full rounded-full ${macroTones[macro.key]}`}
                                        style={{ width: getMacroWidth(macro.current, macro.target) }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </section>
        </main>
    );
}

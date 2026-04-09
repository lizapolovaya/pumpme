import Link from 'next/link';
import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';
import { RerunSessionButton } from './rerun-session-button';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const exerciseAccentTones = ['border-secondary', 'border-primary-dim', 'border-tertiary'] as const;

type CalendarPageProps = {
    searchParams?: Promise<{
        date?: string;
    }>;
};

function formatMonthHeading(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

function formatWeekdayDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC'
    }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function getMaxWeightLabel(weights: Array<number | null>): string {
    let maxWeight = 0;

    for (const value of weights) {
        maxWeight = Math.max(maxWeight, value ?? 0);
    }

    return `${maxWeight.toLocaleString('en-US')}KG`;
}

function getDayButtonTone(
    isCurrentMonth: boolean,
    isSelected: boolean,
    intensity: 'none' | 'light' | 'moderate' | 'high',
    hasVolume: boolean
): string {
    if (!isCurrentMonth) {
        return 'bg-surface-container-low/20 opacity-20';
    }

    if (isSelected) {
        return 'scale-105 z-10 bg-primary-container shadow-2xl';
    }

    if (intensity === 'high') {
        return 'border border-primary-dim/20 bg-primary-container/10';
    }

    if (hasVolume) {
        return 'bg-surface-container-high';
    }

    return 'bg-surface-container-low hover:bg-surface-container-high';
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const params = searchParams ? await searchParams : undefined;
    const { userId } = await resolveCurrentUserContext();
    const services = createBackendServices(userId);
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth() + 1;
    const fallbackDate = today.toISOString().slice(0, 10);
    const selectedDate = params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : fallbackDate;
    const calendar = await services.calendar.getMonth(year, month, selectedDate);
    const monthHeading = formatMonthHeading(new Date(Date.UTC(year, month - 1, 1)));
    const rawSelectedSession = calendar.selectedDay?.sessions[0] ?? null;
    const selectedSession = rawSelectedSession && (
        rawSelectedSession.status === 'completed' ||
        rawSelectedSession.totalVolumeKg !== null ||
        rawSelectedSession.exercises.some((exercise) =>
            exercise.sets.some(
                (set) =>
                    set.completed ||
                    set.weightKg !== null ||
                    set.reps !== null ||
                    set.rpe !== null
            )
        )
    )
        ? rawSelectedSession
        : null;
    const activeDays = calendar.days.filter((day) => day.completedSessionCount > 0).length;
    const weeklyVolumeKg = calendar.days.reduce((sum, day) => sum + (day.hasVolume ? 1 : 0), 0) * 12.4;

    return (
        <>
            <AppHeader />

            <main className="mx-auto min-h-screen max-w-7xl px-4 pt-24 pb-28 md:px-8">
                <section className="mb-8 flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1">
                        <div className="mb-2 flex items-end justify-between">
                            <h2 className="font-headline text-4xl font-black tracking-[-0.08em] text-on-surface">
                                {monthHeading.split(' ')[0].toUpperCase()}{' '}
                                <span className="font-light text-primary-dim/50">{monthHeading.split(' ')[1]}</span>
                            </h2>
                        </div>
                        <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                            Consistency: {Math.round((activeDays / calendar.days.length) * 100)}% •{' '}
                            {calendar.days.reduce((sum, day) => sum + day.sessionCount, 0)} Sessions logged
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:w-80">
                        <article className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-4">
                            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                Weekly Volume
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-headline text-2xl font-black text-secondary">
                                    {weeklyVolumeKg.toFixed(1)}
                                </span>
                                <span className="font-label text-[10px] uppercase text-on-surface-variant">Tons</span>
                            </div>
                        </article>
                        <article className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-4">
                            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                Active Days
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-headline text-2xl font-black text-primary-dim">{activeDays}/28</span>
                            </div>
                        </article>
                    </div>
                </section>

                <div className="flex flex-col gap-8 lg:flex-row">
                    <div className="flex-grow">
                        <div className="grid grid-cols-7 gap-2 md:gap-4">
                            {weekdayLabels.map((label) => (
                                <div
                                    key={label}
                                    className="py-2 text-center font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                                >
                                    {label}
                                </div>
                            ))}

                            {calendar.days.map((item) => {
                                const date = new Date(`${item.date}T00:00:00.000Z`);
                                const isCurrentMonth = date.getUTCMonth() + 1 === month;
                                const isSelected = item.date === selectedDate;
                                const baseClass = getDayButtonTone(
                                    isCurrentMonth,
                                    isSelected,
                                    item.intensity,
                                    item.hasVolume
                                );
                                const dots = Math.min(2, item.sessionCount);

                                return (
                                    <Link
                                        key={item.date}
                                        className={`relative aspect-square rounded-2xl transition-colors ${baseClass}`}
                                        href={`/calendar?date=${item.date}`}
                                    >
                                        <div className="flex h-full flex-col items-center justify-center">
                                            <span
                                                className={`font-label text-sm ${
                                                    isSelected
                                                        ? 'font-black text-on-primary-fixed'
                                                        : item.intensity !== 'none'
                                                          ? 'font-bold text-primary-dim'
                                                          : 'font-bold text-on-surface'
                                                }`}
                                            >
                                                {date.getUTCDate()}
                                            </span>
                                        </div>

                                        {item.intensity === 'moderate' ? (
                                            <div className="absolute inset-0 rounded-2xl border-2 border-primary-dim/30" />
                                        ) : null}

                                        {isSelected ? (
                                            <div className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-dim opacity-75" />
                                                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-container" />
                                            </div>
                                        ) : null}

                                        {dots ? (
                                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                                                {Array.from({ length: dots }).map((_, idx) => (
                                                    <div
                                                        key={`${item.date}-${idx}`}
                                                        className={`h-1.5 w-1.5 rounded-full bg-primary-dim ${
                                                            item.intensity === 'high' || item.intensity === 'moderate'
                                                                ? 'shadow-[0_0_8px_#D1FF26]'
                                                                : ''
                                                        } ${isCurrentMonth ? 'opacity-100' : 'opacity-20'}`}
                                                    />
                                                ))}
                                            </div>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="flex flex-col gap-4 lg:w-96">
                        <section className="overflow-hidden rounded-[32px] bg-surface-container-high shadow-2xl">
                            <div className="relative bg-surface-container-highest p-6">
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-primary-dim">
                                            {formatWeekdayDate(selectedDate)}
                                        </span>
                                        <h3 className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                                            {selectedSession?.title ?? 'Rest Day'}
                                        </h3>
                                    </div>
                                    <span className="rounded-full border border-outline-variant/15 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                        {selectedSession ? selectedSession.status : 'none'}
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col">
                                        <span className="font-label text-[10px] uppercase text-on-surface-variant">
                                            Duration
                                        </span>
                                        <span className="font-headline text-lg font-bold">
                                            {selectedSession?.durationMinutes ?? 0}
                                            <span className="ml-1 text-xs font-normal">MIN</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-label text-[10px] uppercase text-on-surface-variant">
                                            Volume
                                        </span>
                                        <span className="font-headline text-lg font-bold">
                                            {Math.round(selectedSession?.totalVolumeKg ?? 0).toLocaleString('en-US')}
                                            <span className="ml-1 text-xs font-normal">KG</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex max-h-[400px] flex-col gap-4 overflow-y-auto p-6">
                                {selectedSession ? (
                                    selectedSession.exercises.map((exercise, index) => (
                                        <article
                                            key={exercise.id}
                                            className={`rounded-2xl border-l-4 bg-surface-container-low p-4 ${
                                                exerciseAccentTones[index % exerciseAccentTones.length]
                                            }`}
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="font-label text-xs font-bold uppercase tracking-[0.14em] text-on-surface">
                                                    {exercise.exerciseName}
                                                </h4>
                                                <span className="font-label text-[10px] text-on-surface-variant">
                                                    {exercise.sets.length} SETS
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-background/40 p-2 text-center">
                                                    <span className="block font-label text-[8px] uppercase text-on-surface-variant">
                                                        Max Weight
                                                    </span>
                                                    <span className="font-headline text-sm font-bold">
                                                        {getMaxWeightLabel(exercise.sets.map((set) => set.weightKg))}
                                                    </span>
                                                </div>
                                                <div className="rounded-lg bg-background/40 p-2 text-center">
                                                    <span className="block font-label text-[8px] uppercase text-on-surface-variant">
                                                        Total Reps
                                                    </span>
                                                    <span className="font-headline text-sm font-bold">
                                                        {exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="rounded-2xl bg-surface-container-low p-6 text-center text-on-surface-variant">
                                        No session history for this date yet.
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 bg-surface-container-highest p-6">
                                <Link
                                    className="flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-highest py-3 text-center font-headline text-sm font-black italic uppercase tracking-[-0.04em] text-on-surface-variant transition hover:bg-surface-bright"
                                    href={`/workouts?date=${selectedDate}`}
                                >
                                    Open Workout
                                </Link>
                                <RerunSessionButton selectedSession={selectedSession} />
                            </div>
                        </section>
                    </aside>
                </div>
            </main>

            <div className="md:hidden">
                <BottomNav active="calendar" />
            </div>
        </>
    );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Brain, ChevronDown, CircleHelp, Clock3, Gauge, HeartPulse, MoveRight } from 'lucide-react';
import { progressQueryOptions } from '../../lib/client/app-query';
import type { ProgressPointDto, ProgressVolumeWeekDto } from '../../lib/server/backend/types';

type ChartPoint = {
    x: number;
    y: number;
    label: string;
    value: number;
};

function getVolumeBarFill(value: number, maxValue: number): string {
    if (maxValue <= 0) {
        return '12%';
    }

    return `${Math.max(12, Math.round((value / maxValue) * 100))}%`;
}

function buildLineChartPoints(points: ProgressPointDto[]): ChartPoint[] {
    if (!points.length) {
        return [];
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const step = points.length > 1 ? 360 / (points.length - 1) : 0;

    return points.map((point, index) => ({
        x: 20 + step * index,
        y: 180 - Math.round((point.value / maxValue) * 140),
        label: point.label,
        value: point.value
    }));
}

function buildLinePath(points: ChartPoint[]): string {
    if (!points.length) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
        .join(' ');
}

function getVolumeDelta(currentValue: number, previousValue: number): string {
    if (previousValue <= 0) {
        return currentValue > 0 ? '+100.0% vs Prev Window' : 'No change vs Prev Window';
    }

    const delta = ((currentValue - previousValue) / previousValue) * 100;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toFixed(1)}% vs Prev Week`;
}

function getRpeStatus(averageRpe: number): string {
    return averageRpe >= 8 ? 'Optimal Range' : 'Build Intensity';
}

function getRecoveryStatus(recoveryScore: number): string {
    return recoveryScore >= 85 ? 'High Readiness' : 'Monitor Recovery';
}

function getCurrentMonthLabel(): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        timeZone: 'UTC',
        year: 'numeric'
    }).format(new Date());
}

function formatVolume(value: number): string {
    return `${value.toLocaleString('en-US')} KG`;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
    const start = new Date(`${weekStart}T00:00:00.000Z`);
    const end = new Date(`${weekEnd}T00:00:00.000Z`);
    const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(start);
    const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(end);
    const startDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(start);
    const endDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(end);

    if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}`;
    }

    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function formatLiftDate(date: string | null): string {
    if (!date) {
        return 'No training history yet';
    }

    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC'
    }).format(new Date(`${date}T00:00:00.000Z`));
}

function roundToNearest(value: number, step: number): number {
    return Math.round(value / step) * step;
}

function formatLoad(value: number): string {
    const formatted = value.toLocaleString('en-US', {
        maximumFractionDigits: 1,
        minimumFractionDigits: Number.isInteger(value) ? 0 : 1
    });

    return `${formatted} KG`;
}

function buildNextLoadTargets(currentEstimatedOneRmKg: number): Array<{ label: string; percent: number; value: number }> {
    if (currentEstimatedOneRmKg <= 0) {
        return [];
    }

    return [
        { label: 'Base', percent: 80, value: roundToNearest(currentEstimatedOneRmKg * 0.8, 2.5) },
        { label: 'Build', percent: 85, value: roundToNearest(currentEstimatedOneRmKg * 0.85, 2.5) },
        { label: 'Stretch', percent: 90, value: roundToNearest(currentEstimatedOneRmKg * 0.9, 2.5) }
    ];
}

function getOneRmDeltaLabel(currentValue: number, previousValue: number): string {
    if (previousValue <= 0) {
        return currentValue > 0 ? '+ first recorded estimate' : 'No estimate yet';
    }

    const delta = currentValue - previousValue;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toLocaleString('en-US')} kg vs prev month`;
}

function getBarDetailLeft(index: number, total: number): string {
    const percentage = ((index + 0.5) / total) * 100;
    return `${Math.max(10, Math.min(90, percentage))}%`;
}

export default function ProgressPage() {
    const { data: summary, error, isLoading } = useQuery(progressQueryOptions('mtd'));
    const [selectedLiftId, setSelectedLiftId] = useState<string | null>(null);
    const [selectedVolumeLabel, setSelectedVolumeLabel] = useState<string | null>(null);
    const [selectedTrendLabel, setSelectedTrendLabel] = useState<string | null>(null);

    useEffect(() => {
        if (!summary) {
            return;
        }

        if (selectedLiftId && summary.liftSummaries.some((lift) => lift.exerciseId === selectedLiftId)) {
            return;
        }

        setSelectedLiftId(summary.selectedLiftId ?? summary.liftSummaries[0]?.exerciseId ?? null);
    }, [selectedLiftId, summary]);

    if (isLoading || !summary) {
        return <main className="mx-auto max-w-5xl space-y-8 px-6 pt-24 pb-32">Loading progress...</main>;
    }

    if (error) {
        return (
            <main className="mx-auto max-w-5xl space-y-8 px-6 pt-24 pb-32">
                <p className="text-sm text-error">{error instanceof Error ? error.message : 'Unable to load progress.'}</p>
            </main>
        );
    }

    const volumeBars = summary.volumeTrend;
    const selectedLift =
        summary.liftSummaries.find((lift) => lift.exerciseId === selectedLiftId) ??
        summary.liftSummaries.find((lift) => lift.exerciseId === summary.selectedLiftId) ??
        summary.liftSummaries[0] ??
        null;
    const oneRmStats = selectedLift?.trend ?? summary.oneRmTrend;
    const linePoints = buildLineChartPoints(oneRmStats);
    const linePath = buildLinePath(linePoints);
    const volumeMax = Math.max(...volumeBars.map((bar) => bar.value), 1);
    const defaultVolumeBar = volumeBars.find((bar) => bar.isCurrentWeek) ?? volumeBars.at(-1) ?? null;
    const activeVolumeBar = volumeBars.find((bar) => bar.label === selectedVolumeLabel) ?? defaultVolumeBar;
    const activeVolumeIndex = activeVolumeBar ? volumeBars.findIndex((bar) => bar.label === activeVolumeBar.label) : -1;
    const previousVolume = activeVolumeIndex > 0 ? volumeBars[activeVolumeIndex - 1]?.value ?? 0 : 0;
    const activeTrendPoint =
        oneRmStats.find((point) => point.label === selectedTrendLabel) ?? oneRmStats.at(-1) ?? null;
    const activeTrendPointIndex = activeTrendPoint ? oneRmStats.findIndex((point) => point.label === activeTrendPoint.label) : -1;
    const currentPeak = selectedLift?.currentEstimatedOneRmKg ?? oneRmStats.at(-1)?.value ?? 0;
    const previousPeak = selectedLift?.previousEstimatedOneRmKg ?? oneRmStats.at(-2)?.value ?? 0;
    const nextLoadTargets = buildNextLoadTargets(currentPeak);
    const coachHeadline = summary.coach.headline;
    const coachSummary = summary.coach.summary;
    const averageRpe = summary.averageRpe;
    const rpeStatus = getRpeStatus(averageRpe);
    const recoveryScore = summary.recoveryScore;
    const recoveryStatus = getRecoveryStatus(recoveryScore);
    const currentMonthLabel = getCurrentMonthLabel();
    const activeWeekDescriptor = activeVolumeBar?.isCurrentWeek ? 'the current week' : activeVolumeBar?.label ?? 'this week';
    const showVolumeTooltip = selectedVolumeLabel !== null && activeVolumeBar !== null;
    const showLiftTooltip = activeTrendPoint !== null && linePoints.length > 0;

    return (
        <main className="mx-auto max-w-5xl space-y-8 px-6 pt-24 pb-32">
            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="mb-1 font-label text-xs uppercase tracking-[0.2em] text-primary-dim">
                        Performance Matrix
                    </p>
                    <h2 className="font-headline text-4xl font-black uppercase tracking-[-0.06em] text-on-surface">
                        Progress <span className="text-primary-dim">Hub</span>
                    </h2>
                </div>
                <div className="scrollbar-hidden flex items-center gap-3 overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-high px-4 py-2 font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">
                        <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
                        {currentMonthLabel}
                    </div>
                    <div className="rounded-full bg-primary-container px-4 py-2 font-label text-xs font-bold uppercase tracking-[0.14em] text-on-primary-fixed shadow-lg shadow-primary-container/10">
                        Export PDF
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <section className="relative min-h-[220px] overflow-hidden rounded-xl bg-surface-container-low p-6 lg:col-span-2">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-dim/10 blur-3xl" />
                    <div className="relative z-10">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container">
                                <Brain className="h-4 w-4 text-on-primary-fixed" strokeWidth={2.1} />
                            </div>
                            <span className="font-label text-xs font-bold uppercase tracking-[0.18em]">
                                AI Coach Analysis
                            </span>
                        </div>
                        <p className="mb-4 max-w-lg font-headline text-xl font-bold leading-tight">
                            {coachHeadline}{' '}
                            <span className="text-primary-dim">{activeVolumeBar?.value.toLocaleString('en-US') ?? 0} kg</span> logged during{' '}
                            {activeWeekDescriptor}.
                        </p>
                        <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant">
                            {coachSummary}
                        </p>
                    </div>
                    <div className="relative z-10 mt-6 flex items-center gap-4">
                        <a
                            className="flex items-center gap-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-primary-dim transition-all hover:gap-2"
                            href="#progress-metrics"
                        >
                            View Detailed Insights
                            <MoveRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </a>
                    </div>
                </section>
                <section className="relative overflow-hidden rounded-xl border border-secondary/10 bg-surface-container-low p-6">
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />
                    <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                        <div>
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                                <Gauge className="h-5 w-5" strokeWidth={2.1} />
                            </div>
                            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary">RPE Average</p>
                            <p className="mt-3 font-headline text-5xl font-black italic tracking-[-0.08em] text-on-surface">
                                {averageRpe.toFixed(1)}
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">Average across logged workout sets</p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-secondary/60 to-secondary"
                                    style={{ width: `${Math.max(12, Math.min(100, Math.round((averageRpe / 10) * 100)))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Target Intensity</span>
                                <span className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">{rpeStatus}</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="relative overflow-hidden rounded-xl border border-tertiary/10 bg-surface-container-low p-6">
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-tertiary/10 blur-3xl" />
                    <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                        <div>
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/15 text-tertiary">
                                <HeartPulse className="h-5 w-5" strokeWidth={2.1} />
                            </div>
                            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-tertiary">Recovery Score</p>
                            <p className="mt-3 font-headline text-5xl font-black italic tracking-[-0.08em] text-on-surface">
                                {recoveryScore}
                                <span className="ml-1 font-label text-xl uppercase not-italic">%</span>
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">Based on daily readiness entries</p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                                <div
                                    className="h-full rounded-full bg-linear-to-r from-tertiary/60 to-tertiary"
                                    style={{ width: `${Math.max(12, Math.min(100, recoveryScore))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-label text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Recovery Signal</span>
                                <span className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-tertiary">{recoveryStatus}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" id="progress-metrics">
                <section className="flex flex-col rounded-xl bg-surface-container-low p-8">
                    <div className="mb-10 flex items-start justify-between">
                        <div>
                            <h3 className="mb-1 font-headline text-lg font-bold">Volume Trend</h3>
                            <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                Total Weight (KG) / Weekly
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-headline text-2xl font-black text-primary-dim">
                                {activeVolumeBar?.value.toLocaleString('en-US') ?? 0}
                            </p>
                            <p className="font-label text-[10px] font-bold uppercase text-secondary">
                                {getVolumeDelta(activeVolumeBar?.value ?? 0, previousVolume)}
                            </p>
                        </div>
                    </div>
                    <div
                        className="relative flex h-48 flex-1 items-end justify-between gap-2"
                        onMouseLeave={() => setSelectedVolumeLabel(null)}
                    >
                        <div className="absolute inset-0 flex items-end opacity-20">
                            <div className="absolute bottom-0 h-px w-full bg-outline-variant" />
                            <div className="absolute bottom-1/3 h-px w-full bg-outline-variant" />
                            <div className="absolute bottom-2/3 h-px w-full bg-outline-variant" />
                        </div>
                        {showVolumeTooltip && activeVolumeBar ? (
                            <div
                                className="pointer-events-none absolute top-0 z-20 w-36 -translate-x-1/2 rounded-xl border border-primary-dim/20 bg-surface-container-high px-3 py-2 text-left shadow-xl shadow-black/20"
                                data-testid="volume-trend-tooltip"
                                style={{ left: getBarDetailLeft(activeVolumeIndex, volumeBars.length) }}
                            >
                                <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dim">
                                    {activeVolumeBar.label}
                                </p>
                                <p className="mt-1 font-headline text-sm font-bold text-on-surface">
                                    {formatVolume(activeVolumeBar.value)}
                                </p>
                                <p className="mt-1 text-[11px] text-on-surface-variant">
                                    {formatWeekRange(activeVolumeBar.weekStart, activeVolumeBar.weekEnd)}
                                </p>
                            </div>
                        ) : null}
                        {volumeBars.map((bar, index) => {
                            const isActive = bar.label === activeVolumeBar?.label;
                            const isRecent = index >= volumeBars.length - 3;

                            return (
                                <button
                                    aria-label={`${bar.label} ${formatWeekRange(bar.weekStart, bar.weekEnd)} ${formatVolume(bar.value)}`}
                                    aria-pressed={isActive}
                                    className={`relative h-full flex-1 cursor-pointer appearance-none rounded-t-sm border-0 bg-surface-container-highest p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dim ${
                                        isRecent ? 'border-x border-primary-dim/10' : ''
                                    } ${
                                        isActive
                                            ? 'border-x border-primary-dim/30 bg-primary-container/20 shadow-[0_0_20px_rgba(209,255,38,0.15)]'
                                            : ''
                                    }`}
                                    data-testid={`volume-bar-${bar.label}`}
                                    key={bar.label}
                                    onClick={() => setSelectedVolumeLabel(bar.label)}
                                    onBlur={(event) => {
                                        if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                                            setSelectedVolumeLabel(null);
                                        }
                                    }}
                                    onFocus={() => setSelectedVolumeLabel(bar.label)}
                                    onMouseEnter={() => setSelectedVolumeLabel(bar.label)}
                                    type="button"
                                >
                                    <div
                                        className={`absolute bottom-0 w-full rounded-t-sm ${
                                            isActive ? 'bg-primary-dim' : isRecent ? 'bg-primary-dim/50' : 'bg-primary-dim/30'
                                        }`}
                                        style={{ height: getVolumeBarFill(bar.value, volumeMax) }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex justify-between gap-2">
                        {volumeBars.map((bar, index) => (
                            <span
                                key={bar.label}
                                className={`font-label text-[10px] ${
                                    bar.label === activeVolumeBar?.label
                                        ? 'font-bold text-primary-dim'
                                        : bar.isCurrentWeek
                                          ? 'font-bold text-primary-dim'
                                          : 'text-on-surface-variant'
                                }`}
                            >
                                {bar.label}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col rounded-xl bg-surface-container-low p-8">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h3 className="font-headline text-lg font-bold">Estimated 1RM</h3>
                                <CircleHelp className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                            </div>
                            <label className="block">
                                <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                    Primary Lift
                                </span>
                                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2">
                                    <select
                                        aria-label="Primary Lift"
                                        className="min-w-0 appearance-none border-0 bg-transparent pr-6 font-headline text-sm font-bold text-on-surface outline-none"
                                        data-testid="estimated-1rm-select"
                                        value={selectedLift?.exerciseId ?? ''}
                                        onChange={(event) => {
                                            setSelectedLiftId(event.target.value);
                                            setSelectedTrendLabel(null);
                                        }}
                                    >
                                        {summary.liftSummaries.length > 0 ? (
                                            summary.liftSummaries.map((lift) => (
                                                <option key={lift.exerciseId} value={lift.exerciseId}>
                                                    {lift.exerciseName} · {formatLoad(lift.currentEstimatedOneRmKg)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No lift history yet</option>
                                        )}
                                    </select>
                                    <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2.1} />
                                </div>
                            </label>
                            <p className="text-xs text-on-surface-variant">
                                Last trained {formatLiftDate(selectedLift?.lastTrainedAt ?? null)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                Current estimate
                            </p>
                            <p className="font-headline text-3xl font-black italic" data-testid="estimated-1rm-current">
                                {formatLoad(currentPeak)}
                            </p>
                            <p className="mt-1 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dim">
                                {getOneRmDeltaLabel(currentPeak, previousPeak)}
                            </p>
                        </div>
                    </div>

                    <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="relative">
                            <div
                                className="chart-gradient relative h-48 w-full overflow-hidden rounded-bl-lg border-l border-b border-outline-variant/30"
                                onMouseLeave={() => setSelectedTrendLabel(null)}
                            >
                                {showLiftTooltip && activeTrendPoint ? (
                                    <div
                                        className="pointer-events-none absolute top-0 z-20 w-40 -translate-x-1/2 rounded-xl border border-primary-dim/20 bg-surface-container-high px-3 py-2 text-left shadow-xl shadow-black/20"
                                        data-testid="estimated-1rm-tooltip"
                                        style={{ left: getBarDetailLeft(activeTrendPointIndex, linePoints.length) }}
                                    >
                                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dim">
                                            {activeTrendPoint.label}
                                        </p>
                                        <p className="mt-1 font-headline text-sm font-bold text-on-surface">
                                            {formatLoad(activeTrendPoint.value)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-on-surface-variant">
                                            {selectedLift?.exerciseName ?? 'Primary lift'}
                                        </p>
                                    </div>
                                ) : null}
                                <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 400 200">
                                    <defs>
                                        <linearGradient id="grid-fade" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                        </linearGradient>
                                    </defs>
                                    {[40, 90, 140].map((y) => (
                                        <line
                                            key={y}
                                            x1="20"
                                            y1={y}
                                            x2="380"
                                            y2={y}
                                            stroke="url(#grid-fade)"
                                            strokeDasharray="6 8"
                                            strokeWidth="1"
                                        />
                                    ))}
                                    <path
                                        d={linePath}
                                        stroke="#D1FF26"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="4"
                                    />
                                    {linePoints.map((point, index) => {
                                        const isActive = point.label === activeTrendPoint?.label;

                                        return (
                                            <circle
                                                key={`${point.x}-${point.y}-${index}`}
                                                aria-label={`${selectedLift?.exerciseName ?? 'Primary lift'} ${point.label} ${formatLoad(oneRmStats[index]?.value ?? 0)}`}
                                                cx={point.x}
                                                cy={point.y}
                                                fill={isActive ? '#00E3FD' : index === linePoints.length - 1 ? '#D1FF26' : '#D1FF26'}
                                                r={isActive ? 6 : index === linePoints.length - 1 ? 5.5 : 4.5}
                                                role="button"
                                                stroke="#0c0e11"
                                                strokeWidth="3"
                                                tabIndex={0}
                                                onBlur={() => setSelectedTrendLabel(null)}
                                                onClick={() => setSelectedTrendLabel(point.label)}
                                                onFocus={() => setSelectedTrendLabel(point.label)}
                                                onMouseEnter={() => setSelectedTrendLabel(point.label)}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] text-on-surface-variant">
                                {oneRmStats.map((point) => (
                                    <span
                                        key={point.label}
                                        className={point.label === activeTrendPoint?.label ? 'font-bold text-primary-dim' : ''}
                                    >
                                        {point.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
                            <div>
                                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                                    Next session targets
                                </p>
                                <p className="mt-1 text-sm text-on-surface-variant">
                                    Practical load targets based on the current estimate.
                                </p>
                            </div>
                            {nextLoadTargets.length > 0 ? (
                                <div className="space-y-3">
                                    {nextLoadTargets.map((target) => (
                                        <div
                                            key={target.label}
                                            data-testid={`estimated-1rm-target-${target.label.toLowerCase()}`}
                                            className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2"
                                        >
                                            <div>
                                                <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary-dim">
                                                    {target.label}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">{target.percent}% of current</p>
                                            </div>
                                            <p className="font-headline text-sm font-bold text-on-surface">{formatLoad(target.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-on-surface-variant">
                                    Train this lift with logged sets to unlock next-session load targets.
                                </p>
                            )}
                            <p className="text-xs text-on-surface-variant">
                                Rounded to the nearest 2.5 kg from the selected lift&apos;s current estimate.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {summary.logs.length > 0 ? (
                <section className="rounded-xl bg-surface-container-low p-8" id="performance-logs">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                                Performance Logs
                            </p>
                            <h3 className="font-headline text-3xl font-black tracking-[-0.06em]">Latest Signals</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {summary.logs.map((log) => (
                            <article
                                key={`${log.title}-${log.subtitle}`}
                                className="flex items-center justify-between rounded-2xl bg-surface-container-high p-5"
                            >
                                <div>
                                    <p className="font-headline text-lg font-bold">{log.title}</p>
                                    <p className="text-sm text-on-surface-variant">{log.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-headline text-2xl font-black">{log.value}</p>
                                    <p className="font-label text-[10px] font-bold uppercase text-on-surface-variant">{log.status}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}
        </main>
    );
}

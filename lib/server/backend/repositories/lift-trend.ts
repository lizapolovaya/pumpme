import type { ProgressLiftSummaryDto, ProgressPointDto } from '../types';

const LIFT_TREND_MONTHS = 4;

export type LiftTrendSessionRow = {
    date: string;
    exerciseId: string;
    exerciseName: string;
    oneRmValue: number;
};

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function formatMonthLabel(monthValue: string): string {
    const [year, month] = monthValue.split('-').map((value) => Number.parseInt(value, 10));

    if (!year || !month) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getTrendWindowStart(today: Date): string {
    const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    windowStart.setUTCMonth(windowStart.getUTCMonth() - (LIFT_TREND_MONTHS - 1));
    return toIsoDate(windowStart);
}

export function getLiftTrendWindowStart(today: Date): string {
    return getTrendWindowStart(today);
}

export function buildLiftSummaries(
    rows: LiftTrendSessionRow[]
): { liftSummaries: ProgressLiftSummaryDto[]; selectedLiftId: string | null; oneRmTrend: ProgressPointDto[] } {
    if (!rows.length) {
        return {
            liftSummaries: [],
            oneRmTrend: [],
            selectedLiftId: null
        };
    }

    const byExercise = new Map<
        string,
        {
            exerciseName: string;
            lastTrainedAt: string;
            byMonth: Map<string, number>;
        }
    >();

    for (const row of rows) {
        const current = byExercise.get(row.exerciseId) ?? {
            exerciseName: row.exerciseName,
            lastTrainedAt: row.date,
            byMonth: new Map<string, number>()
        };

        if (row.date > current.lastTrainedAt) {
            current.lastTrainedAt = row.date;
            current.exerciseName = row.exerciseName;
        }

        const monthValue = row.date.slice(0, 7);
        const currentMonthValue = current.byMonth.get(monthValue) ?? 0;
        current.byMonth.set(monthValue, Math.max(currentMonthValue, row.oneRmValue));
        byExercise.set(row.exerciseId, current);
    }

    const liftSummaries = Array.from(byExercise.entries())
        .map(([exerciseId, data]) => {
            const trend = Array.from(data.byMonth.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([monthValue, oneRmValue]) => ({
                    label: formatMonthLabel(monthValue),
                    value: Math.round(oneRmValue)
                }));

            return {
                currentEstimatedOneRmKg: trend.at(-1)?.value ?? 0,
                exerciseId,
                exerciseName: data.exerciseName,
                lastTrainedAt: data.lastTrainedAt,
                previousEstimatedOneRmKg: trend.at(-2)?.value ?? 0,
                trend
            };
        })
        .sort((left, right) => {
            if (left.lastTrainedAt !== right.lastTrainedAt) {
                return left.lastTrainedAt < right.lastTrainedAt ? 1 : -1;
            }

            return right.currentEstimatedOneRmKg - left.currentEstimatedOneRmKg;
        });

    const selectedLift = liftSummaries.find((lift) => lift.trend.length >= 2) ?? liftSummaries[0] ?? null;

    return {
        liftSummaries,
        oneRmTrend: selectedLift?.trend ?? [],
        selectedLiftId: selectedLift?.exerciseId ?? null
    };
}

import type { ProgressPointDto } from '../types';

export const VOLUME_TREND_WEEKS = 8;

export type WeeklyVolumeSession = {
    date: string;
    totalVolumeKg: number | null;
};

function getUtcWeekStart(date: Date): Date {
    const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = normalized.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    normalized.setUTCDate(normalized.getUTCDate() + diffToMonday);
    return normalized;
}

function parseIsoDate(dateString: string): Date {
    return new Date(`${dateString}T00:00:00.000Z`);
}

export function getVolumeTrendWindowStart(today: Date): string {
    const currentWeekStart = getUtcWeekStart(today);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - (VOLUME_TREND_WEEKS - 1) * 7);
    return currentWeekStart.toISOString().slice(0, 10);
}

export function buildWeeklyVolumeTrend(sessions: WeeklyVolumeSession[], today: Date): ProgressPointDto[] {
    const currentWeekStart = getUtcWeekStart(today);
    const buckets = Array.from({ length: VOLUME_TREND_WEEKS }, (_, index) => ({
        label: `W${index + 1}`,
        value: 0
    }));

    for (const session of sessions) {
        const sessionWeekStart = getUtcWeekStart(parseIsoDate(session.date));
        const diffWeeks = Math.floor((currentWeekStart.getTime() - sessionWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

        if (diffWeeks < 0 || diffWeeks >= VOLUME_TREND_WEEKS) {
            continue;
        }

        const bucketIndex = VOLUME_TREND_WEEKS - 1 - diffWeeks;
        buckets[bucketIndex]!.value += Math.round(session.totalVolumeKg ?? 0);
    }

    return buckets;
}

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import type {
    BootstrapResponse,
    CalendarMonthDto,
    ProfileBootstrapResponse,
    ProgressSummaryDto,
    WorkoutsBootstrapResponse
} from '../server/backend/types';

export function getTodayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthParams() {
    const now = new Date();

    return {
        month: now.getUTCMonth() + 1,
        selectedDate: now.toISOString().slice(0, 10),
        year: now.getUTCFullYear()
    };
}

export const queryKeys = {
    calendar: (year: number, month: number, selectedDate: string) => ['calendar', year, month, selectedDate] as const,
    profile: (date: string) => ['profile', date] as const,
    progress: (range: string) => ['progress', range] as const,
    today: (date: string) => ['today', date] as const,
    workouts: (date: string, edit: boolean) => ['workouts', date, edit ? 'edit' : 'view'] as const
};

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Request failed');
    }

    return response.json() as Promise<T>;
}

export function todayQueryOptions(date: string) {
    return {
        queryFn: () => fetchJson<BootstrapResponse>(`/api/bootstrap?date=${date}`),
        queryKey: queryKeys.today(date),
        staleTime: 60_000
    };
}

export function profileQueryOptions(date: string) {
    return {
        queryFn: () => fetchJson<ProfileBootstrapResponse>(`/api/profile/bootstrap?date=${date}`),
        queryKey: queryKeys.profile(date),
        staleTime: 60_000
    };
}

export function workoutsQueryOptions(date: string, edit: boolean) {
    const searchParams = new URLSearchParams({
        date
    });

    if (edit) {
        searchParams.set('edit', '1');
    }

    return {
        placeholderData: keepPreviousData,
        queryFn: () => fetchJson<WorkoutsBootstrapResponse>(`/api/workouts/bootstrap?${searchParams.toString()}`),
        queryKey: queryKeys.workouts(date, edit),
        staleTime: 30_000
    };
}

export function calendarQueryOptions(year: number, month: number, selectedDate: string) {
    const searchParams = new URLSearchParams({
        month: String(month),
        selectedDate,
        year: String(year)
    });

    return {
        placeholderData: keepPreviousData,
        queryFn: () => fetchJson<CalendarMonthDto>(`/api/calendar/month?${searchParams.toString()}`),
        queryKey: queryKeys.calendar(year, month, selectedDate),
        staleTime: 30_000
    };
}

export function progressQueryOptions(range: string) {
    return {
        queryFn: () => fetchJson<ProgressSummaryDto>(`/api/progress/summary?range=${range}`),
        queryKey: queryKeys.progress(range),
        staleTime: 60_000
    };
}

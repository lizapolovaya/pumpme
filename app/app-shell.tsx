'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from './components/app-header';
import { BottomNav } from './components/bottom-nav';
import {
    calendarQueryOptions,
    getCurrentMonthParams,
    getTodayIsoDate,
    profileQueryOptions,
    progressQueryOptions,
    todayQueryOptions,
    workoutsQueryOptions
} from '../lib/client/app-query';

const SHELL_HIDDEN_PATHS = new Set(['/help', '/login', '/privacy']);

function getActiveNav(pathname: string) {
    if (pathname.startsWith('/calendar')) {
        return 'calendar';
    }

    if (pathname.startsWith('/workouts')) {
        return 'workouts';
    }

    if (pathname.startsWith('/progress')) {
        return 'progress';
    }

    if (pathname.startsWith('/profile')) {
        return 'profile';
    }

    return 'today';
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const isShellHidden = pathname ? SHELL_HIDDEN_PATHS.has(pathname) : false;

    useEffect(() => {
        if (isShellHidden) {
            return;
        }

        const todayDate = getTodayIsoDate();
        const { month, selectedDate, year } = getCurrentMonthParams();
        const prefetch = () => {
            void queryClient.prefetchQuery(todayQueryOptions(todayDate));
            void queryClient.prefetchQuery(workoutsQueryOptions(todayDate, false));
            void queryClient.prefetchQuery(profileQueryOptions(todayDate));
            void queryClient.prefetchQuery(progressQueryOptions('30d'));
            void queryClient.prefetchQuery(calendarQueryOptions(year, month, selectedDate));
        };

        let timeoutId: number | null = null;
        let idleCallbackId: number | null = null;

        if (typeof window.requestIdleCallback === 'function') {
            idleCallbackId = window.requestIdleCallback(prefetch);
        } else {
            timeoutId = window.setTimeout(prefetch, 250);
        }

        return () => {
            if (idleCallbackId !== null && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleCallbackId);
            }

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [isShellHidden, queryClient]);

    if (isShellHidden) {
        return <>{children}</>;
    }

    return (
        <>
            <AppHeader />
            {children}
            <BottomNav active={getActiveNav(pathname ?? '/')} />
        </>
    );
}

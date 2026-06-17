import { expect, test } from '@playwright/test';
import { authenticateDemoUser } from './helpers';

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function shiftMonth(year: number, month: number, delta: number): { month: number; year: number } {
    const date = new Date(Date.UTC(year, month - 1, 1));
    date.setUTCMonth(date.getUTCMonth() + delta);
    return {
        month: date.getUTCMonth() + 1,
        year: date.getUTCFullYear()
    };
}

function formatMonthHeading(year: number, month: number): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function buildCalendarDays(year: number, month: number, selectedDate: string) {
    return Array.from({ length: 7 }, (_, index) => {
        const day = index + 1;
        const date = `${year}-${pad(month)}-${pad(day)}`;

        return {
            completedSessionCount: day === 3 ? 1 : 0,
            date,
            hasVolume: day === 3,
            intensity: day === 3 ? 'high' : 'none',
            sessionCount: day === 3 ? 1 : 0
        };
    });
}

function buildCalendarResponse(year: number, month: number, selectedDate: string) {
    return {
        days: buildCalendarDays(year, month, selectedDate),
        month,
        selectedDay: {
            date: selectedDate,
            sessions: []
        },
        year
    };
}

function buildBootstrapResponse(date: string) {
    return {
        today: {
            activity: {
                activeMinutes: null,
                date,
                lastSyncedAt: null,
                source: null,
                steps: 0
            },
            nutrition: {
                calories: { current: 0, key: 'calories', target: 0, unit: 'KCAL' },
                carbs: { current: 0, key: 'carbs', target: 0, unit: 'G' },
                fats: { current: 0, key: 'fats', target: 0, unit: 'G' },
                date,
                protein: { current: 0, key: 'protein', target: 0, unit: 'G' }
            },
            plannedWorkout: {
                estimatedDurationMinutes: null,
                focus: null,
                sessionId: null,
                status: 'none',
                templateId: null,
                title: 'No workout planned',
                targetVolumeKg: null
            },
            readiness: {
                band: 'moderate',
                date,
                headline: 'Ready',
                score: null,
                summary: 'No readiness score available.'
            },
            weeklyDiscipline: Array.from({ length: 7 }, (_, index) => ({
                completed: false,
                completedSessionCount: 0,
                date: `2026-06-${pad(index + 1)}`,
                label: `D${index + 1}`,
                sessionCount: 0
            }))
        },
        user: {
            age: null,
            avatarUrl: null,
            biologicalSex: null,
            desiredWeightKg: null,
            displayName: 'E2E User',
            email: null,
            gymSessionsPerWeek: null,
            heightCm: null,
            id: 'e2e-user',
            primaryGoal: 'maintenance',
            stepGoal: null,
            weightKg: null
        },
        preferences: {
            foodDatabaseRegion: 'us',
            themeMode: 'dark',
            unitSystem: 'metric'
        }
    };
}

function buildProfileBootstrapResponse(date: string) {
    return {
        activity: {
            activeMinutes: null,
            date,
            lastSyncedAt: null,
            source: null,
            steps: 0
        },
        googleConnection: {
            available: false,
            connected: false,
            email: null,
            fitnessScopeGranted: false,
            lastSyncAt: null,
            lastSyncError: null
        },
        nutrition: {
            calories: { current: 0, key: 'calories', target: 0, unit: 'KCAL' },
            carbs: { current: 0, key: 'carbs', target: 0, unit: 'G' },
            fats: { current: 0, key: 'fats', target: 0, unit: 'G' },
            date,
            protein: { current: 0, key: 'protein', target: 0, unit: 'G' }
        },
        preferences: {
            foodDatabaseRegion: 'us',
            themeMode: 'dark',
            unitSystem: 'metric'
        },
        profile: {
            age: null,
            avatarUrl: null,
            biologicalSex: null,
            desiredWeightKg: null,
            displayName: 'E2E User',
            email: null,
            gymSessionsPerWeek: null,
            heightCm: null,
            id: 'e2e-user',
            primaryGoal: 'maintenance',
            stepGoal: null,
            weightKg: null
        },
        readiness: {
            band: 'moderate',
            date,
            headline: 'Ready',
            score: null,
            summary: 'No readiness score available.'
        }
    };
}

function buildWorkoutsBootstrapResponse(date: string) {
    return {
        session: null,
        templates: []
    };
}

function buildProgressSummaryResponse() {
    return {
        averageRpe: 0,
        coach: {
            headline: 'Keep building.',
            model: null,
            source: 'heuristic',
            summary: 'No progress data available yet.'
        },
        liftSummaries: [],
        logs: [],
        oneRmTrend: [],
        range: '30d',
        recoveryScore: 0,
        selectedLiftId: null,
        volumeTrend: []
    };
}

test('calendar month picker moves backward, forward, and back to current month', async ({ page }) => {
    await authenticateDemoUser(page);
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth() + 1;
    const currentDate = today.toISOString().slice(0, 10);
    const startingMonth = shiftMonth(currentYear, currentMonth, -1);
    const nextMonth = shiftMonth(currentYear, currentMonth, 1);
    const startingDate = `${startingMonth.year}-${pad(startingMonth.month)}-01`;

    await page.route('**/api/bootstrap**', async (route) => {
        await route.fulfill({
            json: buildBootstrapResponse(currentDate)
        });
    });
    await page.route('**/api/profile/bootstrap**', async (route) => {
        await route.fulfill({
            json: buildProfileBootstrapResponse(currentDate)
        });
    });
    await page.route('**/api/workouts/bootstrap**', async (route) => {
        await route.fulfill({
            json: buildWorkoutsBootstrapResponse(currentDate)
        });
    });
    await page.route('**/api/progress/summary**', async (route) => {
        await route.fulfill({
            json: buildProgressSummaryResponse()
        });
    });
    await page.route('**/api/calendar/month**', async (route) => {
        const url = new URL(route.request().url());
        const year = Number(url.searchParams.get('year'));
        const month = Number(url.searchParams.get('month'));
        const selectedDate = url.searchParams.get('selectedDate') ?? `${year}-${pad(month)}-01`;

        await route.fulfill({
            json: buildCalendarResponse(year, month, selectedDate)
        });
    });

    await page.goto(`/calendar?year=${startingMonth.year}&month=${startingMonth.month}&date=${startingDate}`);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(startingMonth.year, startingMonth.month), 'i') })).toBeVisible();

    await Promise.all([
        page.waitForURL(`**/calendar?year=${currentYear}&month=${currentMonth}**`),
        page.getByRole('button', { name: 'Next Month' }).click()
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(currentYear, currentMonth), 'i') })).toBeVisible();

    await Promise.all([
        page.waitForURL(`**/calendar?year=${nextMonth.year}&month=${nextMonth.month}**`),
        page.getByRole('button', { name: 'Next Month' }).click()
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(nextMonth.year, nextMonth.month), 'i') })).toBeVisible();

    await Promise.all([
        page.waitForURL(`**/calendar?year=${currentYear}&month=${currentMonth}&date=${currentDate}**`),
        page.getByRole('button', { name: 'Current' }).click()
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(currentYear, currentMonth), 'i') })).toBeVisible();

    const directlySelectedMonth = currentMonth === 5 ? 4 : 5;
    await Promise.all([
        page.waitForURL(`**/calendar?year=${currentYear}&month=${directlySelectedMonth}&date=${currentYear}-${pad(directlySelectedMonth)}-01**`),
        page.getByLabel('Calendar month').selectOption(String(directlySelectedMonth))
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(currentYear, directlySelectedMonth), 'i') })).toBeVisible();

    await Promise.all([
        page.waitForURL(`**/calendar?year=${currentYear}&month=${currentMonth}&date=${currentDate}**`),
        page.getByRole('button', { name: 'Current' }).click()
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(currentYear, currentMonth), 'i') })).toBeVisible();

    await Promise.all([
        page.waitForURL(`**/calendar?year=${startingMonth.year}&month=${startingMonth.month}**`),
        page.getByRole('button', { name: 'Prev Month' }).click()
    ]);
    await expect(page.getByRole('heading', { name: new RegExp(formatMonthHeading(startingMonth.year, startingMonth.month), 'i') })).toBeVisible();
});

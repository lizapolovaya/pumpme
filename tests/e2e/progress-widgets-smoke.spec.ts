import { expect, test } from '@playwright/test';
import type { WorkoutSessionDto } from '../../lib/server/backend/types';
import { authenticateDemoUser, expectOkResponse } from './helpers';

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

test('renders the major analytics widgets from seeded workout data', async ({ page }) => {
    const userId = await authenticateDemoUser(page);
    await page.goto('/');
    const headers = {
        'x-pumpme-user-id': userId
    };

    const date = todayIsoDate();

    const startSessionResponse = await page.request.post('/api/workouts/sessions', {
        headers,
        data: {
            date,
            focus: 'Upper body pull',
            title: 'Progress Seeder'
        }
    });
    await expectOkResponse(startSessionResponse, 'expected session creation to succeed');
    const session = (await startSessionResponse.json()) as WorkoutSessionDto;

    const addExerciseResponse = await page.request.post(`/api/workouts/sessions/${session.id}/exercises`, {
        headers,
        data: {
            exerciseId: 'exercise-lat-pulldown',
            exerciseName: 'Lat Pulldown'
        }
    });
    await expectOkResponse(addExerciseResponse, 'expected exercise creation to succeed');
    const sessionWithExercise = (await addExerciseResponse.json()) as WorkoutSessionDto;
    const exerciseRowId = sessionWithExercise.exercises[0]?.id;

    expect(exerciseRowId).toBeTruthy();

    const addSetResponse = await page.request.post(`/api/workouts/sessions/${session.id}/sets`, {
        headers,
        data: {
            exerciseRowId,
            weightKg: 70,
            reps: 10,
            rpe: 8
        }
    });
    await expectOkResponse(addSetResponse, 'expected set creation to succeed');

    const finishSessionResponse = await page.request.post(`/api/workouts/sessions/${session.id}/finish`, { headers });
    await expectOkResponse(finishSessionResponse, 'expected workout completion to succeed');

    const readinessResponse = await page.request.patch(`/api/readiness/today?date=${date}`, {
        headers,
        data: {
            score: 88,
            band: 'high',
            headline: 'Ready',
            summary: 'Recovered and ready to train.'
        }
    });
    await expectOkResponse(readinessResponse, 'expected readiness update to succeed');

    const olderLiftResponse = await page.request.post('/api/workouts/sessions', {
        headers,
        data: {
            date: isoDaysAgo(9),
            focus: 'Upper body',
            title: 'Lift History A'
        }
    });
    await expectOkResponse(olderLiftResponse, 'expected older session creation to succeed');
    const olderLiftSession = (await olderLiftResponse.json()) as WorkoutSessionDto;
    const olderLiftExerciseResponse = await page.request.post(`/api/workouts/sessions/${olderLiftSession.id}/exercises`, {
        headers,
        data: {
            exerciseId: 'exercise-progress-bench',
            exerciseName: 'Progress Bench'
        }
    });
    await expectOkResponse(olderLiftExerciseResponse, 'expected older lift exercise creation to succeed');
    const olderLiftSessionWithExercise = (await olderLiftExerciseResponse.json()) as WorkoutSessionDto;
    const olderLiftExerciseRowId = olderLiftSessionWithExercise.exercises[0]?.id;
    expect(olderLiftExerciseRowId).toBeTruthy();

    const olderLiftSetResponse = await page.request.post(`/api/workouts/sessions/${olderLiftSession.id}/sets`, {
        headers,
        data: {
            exerciseRowId: olderLiftExerciseRowId,
            weightKg: 100,
            reps: 5
        }
    });
    await expectOkResponse(olderLiftSetResponse, 'expected older lift set creation to succeed');
    await expectOkResponse(
        await page.request.post(`/api/workouts/sessions/${olderLiftSession.id}/finish`, { headers }),
        'expected older lift completion to succeed'
    );

    const newerLiftResponse = await page.request.post('/api/workouts/sessions', {
        headers,
        data: {
            date,
            focus: 'Lower body',
            title: 'Lift History B'
        }
    });
    await expectOkResponse(newerLiftResponse, 'expected newer session creation to succeed');
    const newerLiftSession = (await newerLiftResponse.json()) as WorkoutSessionDto;
    const newerLiftExerciseResponse = await page.request.post(`/api/workouts/sessions/${newerLiftSession.id}/exercises`, {
        headers,
        data: {
            exerciseId: 'exercise-progress-deadlift',
            exerciseName: 'Progress Deadlift'
        }
    });
    await expectOkResponse(newerLiftExerciseResponse, 'expected newer lift exercise creation to succeed');
    const newerLiftSessionWithExercise = (await newerLiftExerciseResponse.json()) as WorkoutSessionDto;
    const newerLiftExerciseRowId = newerLiftSessionWithExercise.exercises[0]?.id;
    expect(newerLiftExerciseRowId).toBeTruthy();

    const newerLiftSetResponse = await page.request.post(`/api/workouts/sessions/${newerLiftSession.id}/sets`, {
        headers,
        data: {
            exerciseRowId: newerLiftExerciseRowId,
            weightKg: 400,
            reps: 5
        }
    });
    await expectOkResponse(newerLiftSetResponse, 'expected newer lift set creation to succeed');
    await expectOkResponse(
        await page.request.post(`/api/workouts/sessions/${newerLiftSession.id}/finish`, { headers }),
        'expected newer lift completion to succeed'
    );

    await page.goto('/progress');

    await expect(page.getByRole('heading', { name: /Progress Hub/i })).toBeVisible();
    await expect(page.getByText('AI Coach Analysis')).toBeVisible();
    await expect(page.getByText('RPE Average')).toBeVisible();
    await expect(page.getByText('Recovery Score')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Volume Trend' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Estimated 1RM' })).toBeVisible();

    await expect(page.getByText(/^8\.0$/)).toBeVisible();
    await expect(page.getByText(/^88%$/)).toBeVisible();
    await expect(page.getByText(/^700$/)).toBeVisible();
    await expect(page.getByText(/93\s*KG/)).toBeVisible();
    await expect(page.getByTestId('volume-trend-tooltip')).toHaveCount(0);

    const currentWeekBar = page.getByTestId('volume-bar-W8');
    await currentWeekBar.hover();
    await expect(page.getByTestId('volume-trend-tooltip')).toContainText('W8');
    await expect(page.getByTestId('volume-trend-tooltip')).toContainText('700 KG');
    await page.getByRole('heading', { name: 'Volume Trend' }).hover();
    await expect(page.getByTestId('volume-trend-tooltip')).toHaveCount(0);

    await expect(page.getByTestId('estimated-1rm-select')).toBeVisible();
    await expect(page.getByTestId('estimated-1rm-select')).toHaveValue('exercise-progress-deadlift');
    await expect(page.getByTestId('estimated-1rm-current')).toHaveText('467 KG');

    await page.getByTestId('estimated-1rm-select').selectOption('exercise-progress-bench');
    await expect(page.getByTestId('estimated-1rm-current')).toHaveText('117 KG');
    await expect(page.getByTestId('estimated-1rm-target-base')).toBeVisible();
    await expect(page.getByTestId('estimated-1rm-target-build')).toBeVisible();
    await expect(page.getByTestId('estimated-1rm-target-stretch')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('volume-bar-W7').click();
    await expect(page.getByTestId('volume-trend-tooltip')).toContainText('W7');
    await expect(page.getByTestId('volume-trend-tooltip')).toContainText('0 KG');
});

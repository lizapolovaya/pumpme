import { expect, test } from '@playwright/test';
import type { WorkoutSessionDto } from '../../lib/server/backend/types';
import { authenticateDemoUser, expectOkResponse } from './helpers';

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
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
});

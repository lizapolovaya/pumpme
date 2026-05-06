import { expect, test } from '@playwright/test';
import { authenticateDemoUser, expectOkResponse } from './helpers';

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

test('starts a session, adds an exercise, and logs set values', async ({ page }) => {
    const userId = await authenticateDemoUser(page);

    const date = todayIsoDate();
    const headers = {
        'x-pumpme-user-id': userId
    };

    const sessionResponse = await page.request.post('/api/workouts/sessions', {
        headers,
        data: {
            date,
            focus: 'Upper body pull',
            title: 'Workout Smoke'
        }
    });
    await expectOkResponse(sessionResponse, 'expected workout session creation to succeed');

    await page.goto(`/workouts?date=${date}&edit=1`);

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add exercise' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Exercise Name').fill('Lat Pulldown');
    await dialog.getByRole('button', { name: 'Add' }).click();

    const exerciseHeading = page.getByRole('heading', { name: 'Lat Pulldown' }).first();
    await expect(exerciseHeading).toBeVisible();

    const exerciseCard = page.locator('section').filter({ has: exerciseHeading }).first();
    await exerciseCard.getByRole('button', { name: 'Add Set' }).click();
    await expect(page.getByText('Set added.')).toBeVisible();

    const setInputs = exerciseCard.locator('input[type="text"]');
    const weightInput = setInputs.nth(0);
    const repsInput = setInputs.nth(1);
    const rpeInput = setInputs.nth(2);

    await weightInput.click();
    await weightInput.fill('60');
    await weightInput.press('Tab');
    await expect(repsInput).toBeFocused();

    await repsInput.fill('10');
    await repsInput.press('Tab');
    await expect(rpeInput).toBeFocused();

    await rpeInput.fill('8');
    await exerciseHeading.click();

    await expect(page.getByText('Set updated.')).toBeVisible();
    await expect(weightInput).toHaveValue('60');
    await expect(repsInput).toHaveValue('10');
    await expect(rpeInput).toHaveValue('8');
});

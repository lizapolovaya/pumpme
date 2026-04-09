import { expect, test } from '@playwright/test';

test('adds an exercise to the workout session', async ({ page }) => {
    await page.goto('/login');
    await page.context().addCookies([
        {
            name: 'pumpme_demo_session',
            value: '1',
            url: page.url()
        }
    ]);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Start Workout' })).toBeVisible();

    await page.getByRole('button', { name: 'Start Workout' }).click();
    await page.waitForURL('**/workouts');

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add exercise' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Exercise Name').fill('Lat Pulldown');
    await dialog.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Exercise added.')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Lat Pulldown' }).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('calendar open workout allows editing a completed workout', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
        'x-pumpme-user-id': `e2e-${randomUUID()}`
    });

    const today = new Date().toISOString().slice(0, 10);

    await page.goto('/login');
    await page.context().addCookies([
        {
            name: 'pumpme_demo_session',
            value: '1',
            url: page.url()
        }
    ]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Start Workout' }).click();
    await page.waitForURL('**/workouts');

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add exercise' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Exercise Name').fill('Lat Pulldown');
    await dialog.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('heading', { name: 'Lat Pulldown' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Finish Workout' }).click();
    await expect(page.getByText('Workout finished.')).toBeVisible();

    await page.goto(`/calendar?date=${today}`);
    await page.getByRole('link', { name: 'Open Workout' }).click();
    await page.waitForURL(`**/workouts?date=${today}&edit=1`);

    await expect(page.getByRole('button', { name: 'Add Exercise' })).toBeEnabled();
    await page.getByRole('button', { name: 'Add Exercise' }).click();

    const addDialog = page.getByRole('dialog', { name: 'Add exercise' });
    await expect(addDialog).toBeVisible();
    await addDialog.getByLabel('Exercise Name').fill('Seated Row');
    await addDialog.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Exercise added.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Seated Row' }).first()).toBeVisible();
});

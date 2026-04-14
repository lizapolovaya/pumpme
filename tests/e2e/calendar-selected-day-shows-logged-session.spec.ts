import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('calendar shows the logged workout for a day even if a newer empty session exists', async ({ page }) => {
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

    const emptySessionResponse = await page.request.post('/api/workouts/sessions', {
        data: {
            date: today,
            title: 'Empty Session',
            focus: null
        }
    });
    expect(emptySessionResponse.ok()).toBeTruthy();

    await page.goto('/calendar');
    await expect(page.getByText('Rest Day')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lat Pulldown' }).first()).toBeVisible();

    await page.locator(`a[href="/calendar?date=${today}"]`).click();
    await expect(page.getByText('Rest Day')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lat Pulldown' }).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

test('calendar open workout allows logging for past and future dates', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
        'x-pumpme-user-id': `e2e-${randomUUID()}`
    });

    await page.goto('/login');
    await page.context().addCookies([
        {
            name: 'pumpme_demo_session',
            value: '1',
            url: page.url()
        }
    ]);

    const now = new Date();
    const past = new Date(now);
    past.setUTCDate(past.getUTCDate() - 10);

    const future = new Date(now);
    future.setUTCDate(future.getUTCDate() + 10);

    for (const target of [toIsoDate(past), toIsoDate(future)]) {
        await page.goto(`/calendar?date=${target}`);
        await page.getByRole('link', { name: 'Open Workout' }).click();
        await page.waitForURL(`**/workouts?date=${target}&edit=1`);

        await expect(page.getByRole('heading', { name: 'Bench Press' })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Tricep Pushdowns' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Finish Workout' })).toHaveCount(0);

        await page.getByRole('button', { name: 'Add Exercise' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add exercise' });
        await expect(dialog).toBeVisible();
        await dialog.getByLabel('Exercise Name').fill('Lat Pulldown');
        await dialog.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText('Exercise added.')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lat Pulldown' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Finish Workout' })).toBeVisible();
    }
});

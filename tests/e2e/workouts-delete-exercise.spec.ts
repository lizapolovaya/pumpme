import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('deletes an exercise from the workout session', async ({ page }) => {
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
    await page.goto('/');

    await page.getByRole('button', { name: 'Start Workout' }).click();
    await page.waitForURL('**/workouts');

    const latPulldownHeadings = page.getByRole('heading', { name: 'Lat Pulldown' });
    const countBeforeAdd = await latPulldownHeadings.count();

    await page.getByRole('button', { name: 'Add Exercise' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add exercise' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Exercise Name').fill('Lat Pulldown');
    await dialog.getByRole('button', { name: 'Add' }).click();
    await expect(latPulldownHeadings).toHaveCount(countBeforeAdd + 1);

    page.once('dialog', (modal) => modal.accept());
    await page.getByRole('button', { name: 'Delete Lat Pulldown' }).first().click();

    await expect(page.getByText('Lat Pulldown removed.')).toBeVisible();
    await expect(latPulldownHeadings).toHaveCount(countBeforeAdd);
});

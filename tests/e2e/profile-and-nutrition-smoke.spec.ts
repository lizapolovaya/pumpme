import { expect, test } from '@playwright/test';
import { authenticateDemoUser, fieldControl } from './helpers';

test('updates profile settings and dashboard nutrition intake', async ({ page }) => {
    await authenticateDemoUser(page);

    await page.goto('/profile');

    await fieldControl(page, 'Full Name').fill('E2E Athlete');
    await fieldControl(page, 'Age').fill('29');
    await fieldControl(page, 'Biological Sex').selectOption('female');
    await fieldControl(page, 'Primary Goal').selectOption('strength');
    await fieldControl(page, 'Current Weight (kg)').fill('68');
    await fieldControl(page, 'Desired Weight (kg)').fill('64');

    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Profile and nutrition targets saved.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E2E Athlete' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: 'Edit Intake' }).click();

    await page.locator('label:has-text("Calories") input').fill('2200');
    await page.locator('label:has-text("Protein") input').fill('180');
    await page.locator('label:has-text("Carbs") input').fill('210');
    await page.locator('label:has-text("Fats") input').fill('70');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Nutrition intake saved.')).toBeVisible();
    await expect(page.getByText(/2200kcal\s*\/\s*\d+kcal/i)).toBeVisible();
    await expect(page.getByText(/180g\s*\/\s*\d+g/i).first()).toBeVisible();
    await expect(page.getByText(/210g\s*\/\s*\d+g/i)).toBeVisible();
    await expect(page.getByText(/70g\s*\/\s*\d+g/i)).toBeVisible();
});

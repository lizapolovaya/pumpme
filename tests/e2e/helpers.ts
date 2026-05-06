import { randomUUID } from 'node:crypto';
import { expect, type APIResponse, type Page } from '@playwright/test';

export async function authenticateDemoUser(page: Page): Promise<string> {
    const userId = `e2e-${randomUUID()}`;

    await page.context().setExtraHTTPHeaders({
        'x-pumpme-user-id': userId
    });

    return userId;
}

export function fieldControl(page: Page, label: string) {
    return page.locator(`label:has-text("${label}")`).locator('..').locator('input, select').first();
}

export async function expectOkResponse(response: APIResponse, message: string) {
    expect(response.ok(), message).toBeTruthy();
}

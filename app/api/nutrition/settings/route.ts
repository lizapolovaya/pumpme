import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseNutritionSettingsUpdate } from '../../../../lib/server/backend/http';

export async function GET() {
    try {
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const settings = await services.nutrition.getSettings();

        return NextResponse.json(settings);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load nutrition settings', 500);
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseNutritionSettingsUpdate(body);
        const services = createBackendServices(userId);
        const settings = await services.nutrition.updateSettings(input);

        return NextResponse.json(settings);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update nutrition settings';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

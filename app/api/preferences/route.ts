import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../lib/server/backend';
import { jsonError, parseJsonBody, parsePreferencesUpdate } from '../../../lib/server/backend/http';

export async function GET() {
    try {
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const preferences = await services.preferences.getPreferences();

        return NextResponse.json(preferences);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load preferences', 500);
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parsePreferencesUpdate(body);
        const services = createBackendServices(userId);
        const preferences = await services.preferences.updatePreferences(input);

        return NextResponse.json(preferences);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update preferences';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

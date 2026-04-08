import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../lib/server/backend';
import { jsonError, parseJsonBody, parseProfileUpdate } from '../../../lib/server/backend/http';

export async function GET() {
    try {
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const profile = await services.profile.getProfile();

        return NextResponse.json(profile);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load profile', 500);
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseProfileUpdate(body);
        const services = createBackendServices(userId);
        const profile = await services.profile.updateProfile(input);

        return NextResponse.json(profile);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update profile';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

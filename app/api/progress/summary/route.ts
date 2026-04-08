import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError } from '../../../../lib/server/backend/http';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const range = url.searchParams.get('range') ?? '30d';
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const summary = await services.analytics.getProgress(range);

        return NextResponse.json(summary);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load progress summary', 500);
    }
}

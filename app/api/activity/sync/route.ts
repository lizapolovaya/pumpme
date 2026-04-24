import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseActivitySync, parseJsonBody } from '../../../../lib/server/backend/http';

export async function POST(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const { date, input } = parseActivitySync(body);
        const services = createBackendServices(userId);
        const activity = await services.activity.syncDay(date, input);

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to sync activity';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

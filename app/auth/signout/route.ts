import { NextResponse } from 'next/server';
import { createSupabaseServerAuthClient } from '../../../lib/server/auth/supabase';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const redirectUrl = new URL('/login', url.origin);
    const client = await createSupabaseServerAuthClient();

    if (client) {
        await client.auth.signOut();
    }

    return NextResponse.redirect(redirectUrl);
}


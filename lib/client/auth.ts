'use client';

export async function startGoogleAuthFlow(nextPath = '/'): Promise<void> {
    const redirectUrl = new URL('/auth/google', window.location.origin);
    redirectUrl.searchParams.set('next', nextPath);
    window.location.assign(redirectUrl.toString());
}

export type AuthenticatedUserSeed = {
    avatarUrl?: string | null;
    displayName?: string | null;
    email?: string | null;
};

export type GoogleConnectionRecord = {
    accessToken: string | null;
    accessTokenExpiresAt: string | null;
    connectedAt: string | null;
    email: string | null;
    googleUserId: string | null;
    lastSyncAt: string | null;
    lastSyncError: string | null;
    refreshToken: string | null;
    scopes: string[];
    userId: string;
};


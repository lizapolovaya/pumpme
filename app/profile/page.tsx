'use client';

import { useQuery } from '@tanstack/react-query';
import { getTodayIsoDate, profileQueryOptions } from '../../lib/client/app-query';
import { ProfileClient } from './profile-client';

export default function ProfilePage() {
    const todayDate = getTodayIsoDate();
    const { data, error, isLoading } = useQuery(profileQueryOptions(todayDate));

    if (isLoading || !data) {
        return <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">Loading profile...</main>;
    }

    if (error) {
        return (
            <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">
                <p className="text-sm text-error">{error instanceof Error ? error.message : 'Unable to load profile.'}</p>
            </main>
        );
    }

    return (
        <ProfileClient
            initialNutrition={data.nutrition}
            initialPreferences={data.preferences}
            initialProfile={data.profile}
            readiness={data.readiness}
            todayDate={todayDate}
        />
    );
}

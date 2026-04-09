import { AppHeader } from '../components/app-header';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
    const { userId } = await resolveCurrentUserContext();
    const services = createBackendServices(userId);
    const today = new Date().toISOString().slice(0, 10);
    const [profile, preferences, readiness, nutrition] = await Promise.all([
        services.profile.getProfile(),
        services.preferences.getPreferences(),
        services.readiness.getDay(today),
        services.nutrition.getDay(today)
    ]);

    return (
        <>
            <AppHeader />
            <ProfileClient
                initialNutrition={nutrition}
                initialPreferences={preferences}
                initialProfile={profile}
                readiness={readiness}
            />
        </>
    );
}

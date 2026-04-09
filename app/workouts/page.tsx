import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';
import { WorkoutSessionClient } from './workout-session-client';

type WorkoutsPageProps = {
    searchParams?: Promise<{
        activate?: string;
    }>;
};

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
    const params = searchParams ? await searchParams : undefined;
    const { userId } = await resolveCurrentUserContext();
    const services = createBackendServices(userId);
    const today = new Date().toISOString().slice(0, 10);
    const [session, templates] = await Promise.all([
        services.workouts.getSessionByDate(today),
        services.workouts.listTemplates()
    ]);

    if (!session) {
        return null;
    }

    return (
        <>
            <AppHeader />

            <WorkoutSessionClient
                activateOnMount={params?.activate === '1'}
                initialSession={session}
                templates={templates}
            />

            <BottomNav active="workouts" />
        </>
    );
}

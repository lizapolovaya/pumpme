'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
    Cake,
    ChevronRight,
    CircleHelp,
    Dumbbell,
    LogOut,
    Mail,
    Pencil,
    RefreshCw,
    Shield,
    Sparkles,
    User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { queryKeys } from '../../lib/client/app-query';
import { getSupabaseBrowserClient } from '../../lib/client/supabase-browser';
import type {
    NutritionDayDto,
    PreferencesDto,
    PrimaryGoal,
    ProfileBootstrapResponse,
    ProfileDto,
    ReadinessDayDto
} from '../../lib/server/backend/types';

type ProfileClientProps = {
    initialNutrition: NutritionDayDto;
    initialPreferences: PreferencesDto;
    initialProfile: ProfileDto;
    readiness: ReadinessDayDto;
    todayDate: string;
};

const primaryGoals: PrimaryGoal[] = [
    'muscle_gain',
    'fat_loss',
    'strength',
    'maintenance',
    'athleticism'
];

const infoLinks = [
    { href: '/help', label: 'Help & FAQ', icon: CircleHelp },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield }
] as const;

const COOKIE_NAME = 'pumpme_demo_session';

function formatGoal(goal: string): string {
    return goal
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatBand(band: string): string {
    return band.charAt(0).toUpperCase() + band.slice(1);
}

export function ProfileClient({
    initialNutrition,
    initialPreferences,
    initialProfile,
    readiness,
    todayDate
}: ProfileClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [profile, setProfile] = useState(initialProfile);
    const [preferences, setPreferences] = useState(initialPreferences);
    const [nutrition, setNutrition] = useState(initialNutrition);
    const [readinessState, setReadinessState] = useState(readiness);
    const [displayName, setDisplayName] = useState(initialProfile.displayName);
    const [age, setAge] = useState(initialProfile.age ? String(initialProfile.age) : '');
    const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(initialProfile.primaryGoal);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const nutritionCompletion = nutrition.calories.target
        ? Math.min(100, Math.round((nutrition.calories.current / nutrition.calories.target) * 100))
        : 0;

    async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
        const response = await fetch(input, init);

        if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(payload?.error ?? 'Request failed');
        }

        return response.json() as Promise<T>;
    }

    useEffect(() => {
        setProfile(initialProfile);
        setPreferences(initialPreferences);
        setNutrition(initialNutrition);
        setReadinessState(readiness);
        setDisplayName(initialProfile.displayName);
        setAge(initialProfile.age ? String(initialProfile.age) : '');
        setPrimaryGoal(initialProfile.primaryGoal);
    }, [initialNutrition, initialPreferences, initialProfile, readiness]);

    useEffect(() => {
        const client = getSupabaseBrowserClient();
        if (!client) {
            return;
        }

        let isActive = true;
        let syncTimeout: ReturnType<typeof setTimeout> | null = null;

        const syncProfileState = () => {
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            syncTimeout = setTimeout(async () => {
                try {
                    const bootstrap = await requestJson<ProfileBootstrapResponse>(`/api/profile/bootstrap?date=${todayDate}`);

                    if (!isActive) {
                        return;
                    }

                    setProfile(bootstrap.profile);
                    setDisplayName(bootstrap.profile.displayName);
                    setAge(bootstrap.profile.age ? String(bootstrap.profile.age) : '');
                    setPrimaryGoal(bootstrap.profile.primaryGoal);
                    setPreferences(bootstrap.preferences);
                    setNutrition(bootstrap.nutrition);
                    setReadinessState(bootstrap.readiness);
                    queryClient.setQueryData(queryKeys.profile(todayDate), bootstrap);
                } catch {
                    return;
                }
            }, 120);
        };

        const channel = client
            .channel(`profile-sync:${profile.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${profile.id}`
            }, syncProfileState)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_metrics',
                filter: `user_id=eq.${profile.id}`
            }, syncProfileState)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_preferences',
                filter: `user_id=eq.${profile.id}`
            }, syncProfileState)
            .subscribe();

        return () => {
            isActive = false;
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }

            client.removeChannel(channel);
        };
    }, [profile.id, queryClient, todayDate]);

    function handleSaveProfile() {
        startTransition(async () => {
            setFeedback(null);
            setError(null);

            try {
                const nextProfile = await requestJson<ProfileDto>('/api/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        age: age.trim().length ? Number(age) : null,
                        displayName: displayName.trim(),
                        primaryGoal
                    })
                });

                setProfile(nextProfile);
                setDisplayName(nextProfile.displayName);
                setAge(nextProfile.age ? String(nextProfile.age) : '');
                setPrimaryGoal(nextProfile.primaryGoal);
                queryClient.setQueryData(queryKeys.profile(todayDate), (current: ProfileBootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              profile: nextProfile
                          }
                        : current
                );
                setFeedback('Profile saved.');
            } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Unable to save profile');
            }
        });
    }

    function handleAvatarUpdate() {
        const nextAvatar = window.prompt('Profile image URL. Leave empty to clear it.', profile.avatarUrl ?? '');

        if (nextAvatar === null) {
            return;
        }

        startTransition(async () => {
            setFeedback(null);
            setError(null);

            try {
                const nextProfile = await requestJson<ProfileDto>('/api/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        avatarUrl: nextAvatar.trim() || null
                    })
                });

                setProfile(nextProfile);
                queryClient.setQueryData(queryKeys.profile(todayDate), (current: ProfileBootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              profile: nextProfile
                          }
                        : current
                );
                setFeedback('Profile photo updated.');
            } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Unable to update profile photo');
            }
        });
    }

    function handleUnitSystemChange(unitSystem: PreferencesDto['unitSystem']) {
        if (preferences.unitSystem === unitSystem) {
            return;
        }

        startTransition(async () => {
            setFeedback(null);
            setError(null);

            try {
                const nextPreferences = await requestJson<PreferencesDto>('/api/preferences', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        unitSystem
                    })
                });

                setPreferences(nextPreferences);
                queryClient.setQueryData(queryKeys.profile(todayDate), (current: ProfileBootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              preferences: nextPreferences
                          }
                        : current
                );
                setFeedback('Measurement units updated.');
            } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Unable to update preferences');
            }
        });
    }

    function handleFoodDatabaseUpdate() {
        const nextRegion = window.prompt('Food database region', preferences.foodDatabaseRegion);

        if (nextRegion === null || nextRegion.trim().length === 0) {
            return;
        }

        startTransition(async () => {
            setFeedback(null);
            setError(null);

            try {
                const nextPreferences = await requestJson<PreferencesDto>('/api/preferences', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        foodDatabaseRegion: nextRegion.trim()
                    })
                });

                setPreferences(nextPreferences);
                queryClient.setQueryData(queryKeys.profile(todayDate), (current: ProfileBootstrapResponse | undefined) =>
                    current
                        ? {
                              ...current,
                              preferences: nextPreferences
                          }
                        : current
                );
                setFeedback('Food database updated.');
            } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Unable to update food database');
            }
        });
    }

    function handleLogout() {
        document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
        router.push('/login');
    }

    return (
        <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">
            <section className="mb-6 space-y-2">
                {feedback ? <p className="text-sm text-primary-dim">{feedback}</p> : null}
                {error ? <p className="text-sm text-error">{error}</p> : null}
            </section>

            <section className="mb-12 grid grid-cols-1 items-end gap-8 md:grid-cols-12">
                <div className="flex justify-center md:col-span-4 md:justify-start">
                    <div className="group relative">
                        <div className="absolute -inset-4 rounded-full bg-secondary/10 blur-2xl transition-all group-hover:bg-secondary/20" />
                        <div className="relative h-48 w-48 overflow-hidden rounded-full border-[6px] border-surface-container-high md:h-56 md:w-56">
                            <img
                                alt="Profile picture"
                                className="h-full w-full object-cover"
                                src={profile.avatarUrl ?? 'https://placehold.co/512x512/0c0e11/c1ed00?text=PumpMe'}
                            />
                        </div>
                        <button
                            className="absolute right-2 bottom-2 rounded-full bg-primary p-3 text-on-primary-fixed shadow-2xl transition-transform hover:scale-105 active:scale-95"
                            disabled={isPending}
                            onClick={handleAvatarUpdate}
                            type="button"
                        >
                            <Pencil className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-4 md:col-span-8 md:items-start">
                    <div className="space-y-1">
                        <h2 className="font-headline text-4xl font-black italic uppercase leading-none tracking-[-0.08em] text-on-surface md:text-6xl">
                            {profile.displayName}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            className="rounded-xl bg-linear-to-br from-primary to-primary-container px-8 py-3 font-headline font-bold uppercase tracking-[-0.04em] text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isPending}
                            onClick={handleSaveProfile}
                            type="button"
                        >
                            {isPending ? 'Saving' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <section className="rounded-3xl border-l-4 border-secondary bg-surface-container-low p-8">
                            <div className="mb-8 flex items-center justify-between">
                                <h3 className="font-headline text-xl font-bold uppercase tracking-[-0.04em]">
                                    Personal Metrics
                                </h3>
                                <CircleHelp className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                            </div>
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                                        Full Name
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl bg-surface-container-highest p-4">
                                        <User className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                        <input
                                            className="w-full border-none bg-transparent font-body font-semibold text-on-surface placeholder:text-outline-variant focus:ring-0"
                                            onChange={(event) => setDisplayName(event.target.value)}
                                            type="text"
                                            value={displayName}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                                        Age
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl bg-surface-container-highest p-4">
                                        <Cake className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                        <input
                                            className="w-full border-none bg-transparent font-body font-semibold text-on-surface focus:ring-0"
                                            onChange={(event) => setAge(event.target.value)}
                                            type="number"
                                            value={age}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                                        Primary Goal
                                    </label>
                                    <div className="flex items-center gap-3 rounded-xl bg-surface-container-highest p-4">
                                        <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2.1} />
                                        <select
                                            className="w-full border-none bg-transparent font-body font-semibold text-on-surface focus:ring-0"
                                            onChange={(event) => setPrimaryGoal(event.target.value as PrimaryGoal)}
                                            value={primaryGoal}
                                        >
                                            {primaryGoals.map((goal) => (
                                                <option key={goal} value={goal}>
                                                    {formatGoal(goal)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                                        Readiness Status
                                    </label>
                                    <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-surface-container-highest/50 p-4">
                                                <div className="flex items-center gap-3">
                                            <RefreshCw className="h-4 w-4 text-[#4285F4]" strokeWidth={2.1} />
                                            <span className="font-body font-semibold">
                                                {formatBand(readinessState.band)} ({readinessState.score ?? 0})
                                            </span>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#D1FF26]" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl bg-surface-container-low p-8">
                            <h3 className="mb-8 font-headline text-xl font-bold uppercase tracking-[-0.04em]">
                                Security &amp; Access
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-2xl bg-surface-container-highest p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low">
                                            <Mail className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                        </div>
                                        <div>
                                            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                                Email Address
                                            </p>
                                            <p className="font-body font-medium">{profile.email ?? 'No email set'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-surface-container-highest p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low">
                                            <Shield className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                        </div>
                                        <div>
                                            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                                Password
                                            </p>
                                            <p className="font-body font-medium">Managed in demo mode</p>
                                        </div>
                                    </div>
                                    <span className="font-headline text-xs font-bold uppercase text-primary">
                                        Local Demo
                                    </span>
                                </div>
                            </div>
                            <button
                                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/20 py-4 font-headline font-bold uppercase text-error transition-all hover:bg-error/5"
                                onClick={handleLogout}
                                type="button"
                            >
                                <LogOut className="h-4 w-4" strokeWidth={2.1} />
                                Log Out
                            </button>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-8">
                            <p className="mb-4 font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
                                Activity Level
                            </p>
                            <div className="mb-2 flex items-baseline gap-2">
                                <span className="font-headline text-5xl font-black italic tracking-[-0.08em] text-on-surface">
                                    {profile.stepGoal ? Math.round((profile.stepGoal * nutritionCompletion) / 100).toLocaleString('en-US') : '0'}
                                </span>
                                <span className="font-label text-sm uppercase text-secondary">Steps</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                                <div className="h-full rounded-full bg-linear-to-r from-secondary to-secondary-dim" style={{ width: `${nutritionCompletion}%` }} />
                            </div>
                            <p className="mt-4 text-xs text-on-surface-variant">
                                Daily Goal: {profile.stepGoal?.toLocaleString('en-US') ?? '0'} steps
                            </p>
                        </section>

                        <section className="space-y-6 rounded-3xl bg-surface-container-low p-8">
                            <h3 className="font-headline text-lg font-bold uppercase tracking-[-0.04em]">Preferences</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                        Measurement Units
                                    </p>
                                    <div className="flex rounded-xl bg-surface-container-highest p-1">
                                        <button
                                            className={`flex-1 rounded-lg py-2 font-headline text-xs font-bold uppercase ${
                                                preferences.unitSystem === 'metric'
                                                    ? 'bg-surface-bright text-primary shadow-lg'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                            disabled={isPending}
                                            onClick={() => handleUnitSystemChange('metric')}
                                            type="button"
                                        >
                                            Metric (kg/cm)
                                        </button>
                                        <button
                                            className={`flex-1 rounded-lg py-2 font-headline text-xs font-bold uppercase ${
                                                preferences.unitSystem === 'imperial'
                                                    ? 'bg-surface-bright text-primary shadow-lg'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                            disabled={isPending}
                                            onClick={() => handleUnitSystemChange('imperial')}
                                            type="button"
                                        >
                                            Imperial (lb/in)
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                        Food Database
                                    </p>
                                    <button
                                        className="flex w-full items-center justify-between rounded-xl bg-surface-container-highest p-4 text-left"
                                        disabled={isPending}
                                        onClick={handleFoodDatabaseUpdate}
                                        type="button"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">🇺🇸</span>
                                            <span className="font-body font-medium">{preferences.foodDatabaseRegion}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 rounded-3xl bg-surface-container-low p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                        Fuel Progress
                                    </p>
                                    <p className="font-body font-medium text-on-surface">
                                        {Math.round(nutrition.calories.current).toLocaleString('en-US')} /{' '}
                                        {Math.round(nutrition.calories.target).toLocaleString('en-US')} kcal
                                    </p>
                                </div>
                                <Sparkles className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                            </div>
                            {infoLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.label}
                                        className="group flex items-center justify-between border-b border-outline-variant/10 py-2 last:border-b-0"
                                        href={item.href}
                                    >
                                        <span className="font-body font-medium text-on-surface transition-colors group-hover:text-primary">
                                            {item.label}
                                        </span>
                                        <Icon className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                                    </Link>
                                );
                            })}
                        </section>
                    </div>
                </div>
        </main>
    );
}

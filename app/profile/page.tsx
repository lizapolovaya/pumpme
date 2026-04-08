import {
  ChevronRight,
  CircleHelp,
  Dumbbell,
  LogOut,
  Mail,
  Pencil,
  Shield,
  Sparkles,
  User,
  Cake,
  Footprints,
  RefreshCw
} from 'lucide-react';
import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';

type AccountItem = {
  label: string;
  value: string;
  icon: typeof Mail;
  trailing?: string;
};

const infoLinks = [
  { label: 'Help & FAQ', icon: CircleHelp },
  { label: 'Privacy Policy', icon: Shield }
] as const;

function formatGoal(goal: string): string {
  return goal
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatBand(band: string): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

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

  const accountItems: AccountItem[] = [
    {
      label: 'Email Address',
      value: profile.email ?? 'No email set',
      icon: Mail
    },
    {
      label: 'Password',
      value: '••••••••••••',
      icon: Shield,
      trailing: 'Change'
    }
  ];

  const nutritionCompletion = nutrition.calories.target
    ? Math.min(100, Math.round((nutrition.calories.current / nutrition.calories.target) * 100))
    : 0;

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">
        <section className="mb-12 grid grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="flex justify-center md:col-span-4 md:justify-start">
            <div className="group relative">
              <div className="absolute -inset-4 rounded-full bg-secondary/10 blur-2xl transition-all group-hover:bg-secondary/20" />
              <div className="relative h-48 w-48 overflow-hidden rounded-full border-[6px] border-surface-container-high md:h-56 md:w-56">
                <img
                  alt="Profile picture"
                  className="h-full w-full object-cover"
                  src={profile.avatarUrl ?? ''}
                />
              </div>
              <button className="absolute right-2 bottom-2 rounded-full bg-primary p-3 text-on-primary-fixed shadow-2xl transition-transform hover:scale-105 active:scale-95" type="button" aria-label="Edit profile picture">
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
              <button className="rounded-xl bg-linear-to-br from-primary to-primary-container px-8 py-3 font-headline font-bold uppercase tracking-[-0.04em] text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" type="button">
                Edit Profile
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
                    <input className="w-full border-none bg-transparent font-body font-semibold text-on-surface placeholder:text-outline-variant focus:ring-0" type="text" defaultValue={profile.displayName} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    Age
                  </label>
                  <div className="flex items-center gap-3 rounded-xl bg-surface-container-highest p-4">
                    <Cake className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                    <input className="w-full border-none bg-transparent font-body font-semibold text-on-surface focus:ring-0" type="text" defaultValue={profile.age ? `${profile.age} Years` : ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    Primary Goal
                  </label>
                  <div className="flex cursor-pointer items-center justify-between rounded-xl bg-surface-container-highest p-4 transition-all hover:bg-surface-container-highest/80">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="h-4 w-4 text-primary" strokeWidth={2.1} />
                      <span className="font-body font-semibold">{formatGoal(profile.primaryGoal)}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
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
                        {formatBand(readiness.band)} ({readiness.score ?? 0})
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
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface-container-highest p-4 transition-all hover:bg-surface-bright"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low">
                          <Icon className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                        </div>
                        <div>
                          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                            {item.label}
                          </p>
                          <p className="font-body font-medium">{item.value}</p>
                        </div>
                      </div>
                      {item.trailing ? (
                        <span className="font-headline text-xs font-bold uppercase text-primary">
                          {item.trailing}
                        </span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/20 py-4 font-headline font-bold uppercase text-error transition-all hover:bg-error/5" type="button">
                <LogOut className="h-4 w-4" strokeWidth={2.1} />
                Log Out
              </button>
            </section>
          </div>

          <div className="space-y-6">
            <section className="group relative overflow-hidden rounded-3xl bg-surface-container-low p-8">
              <div className="absolute top-0 right-0 p-8">
                <Footprints className="h-16 w-16 rotate-12 text-secondary/30" strokeWidth={1.8} />
              </div>
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
                  <div className="flex cursor-pointer items-center justify-between rounded-xl bg-surface-container-highest p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇺🇸</span>
                      <span className="font-body font-medium">{preferences.foodDatabaseRegion}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                  </div>
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
                    {Math.round(nutrition.calories.current).toLocaleString('en-US')} / {Math.round(nutrition.calories.target).toLocaleString('en-US')} kcal
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
              </div>
              {infoLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="group flex cursor-pointer items-center justify-between border-b border-outline-variant/10 py-2 last:border-b-0"
                  >
                    <span className="font-body font-medium text-on-surface transition-colors group-hover:text-primary">
                      {item.label}
                    </span>
                    <Icon className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </main>

      <BottomNav active="progress" />
    </>
  );
}

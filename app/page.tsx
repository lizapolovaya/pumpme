import Link from 'next/link';
import {
  ArrowUpRight,
  Bolt,
  Play,
} from 'lucide-react';
import { BottomNav } from './components/bottom-nav';

const readinessScore = 82;
const circumference = 2 * Math.PI * 40;
const readinessOffset = circumference - (readinessScore / 100) * circumference;

const planStats = [
  ['Est. Duration', '75 MIN'],
  ['Target Volume', '12,400 KG']
] as const;

const macros = [
  { name: 'Protein', current: '145g', target: '180g', width: '80%', tone: 'bg-primary-dim' },
  { name: 'Carbs', current: '210g', target: '350g', width: '60%', tone: 'bg-secondary' },
  { name: 'Fats', current: '52g', target: '75g', width: '70%', tone: 'bg-tertiary' }
] as const;

const weeklyDiscipline = [
  { day: 'M', height: 'h-8', active: true },
  { day: 'T', height: 'h-12', active: true },
  { day: 'W', height: 'h-2', active: false },
  { day: 'T', height: 'h-10', active: true },
  { day: 'F', height: 'h-14', active: true },
  { day: 'S', height: 'h-8', active: true },
  { day: 'S', height: 'h-2', active: false }
] as const;

export default function Home() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 bg-background">
        <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between bg-surface-container-low/80 px-6 backdrop-blur-md md:max-w-5xl">
          <div className="flex items-center gap-3">
            <Bolt className="h-5 w-5 text-primary-container" strokeWidth={2.2} />
            <h1 className="font-headline text-xl font-bold italic uppercase tracking-[-0.08em] text-primary-container">
              PumpMe
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container/20 transition-transform duration-150 active:scale-95"
              aria-label="Open profile"
            >
              <img
                className="h-full w-full object-cover"
                alt="Profile avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXb6bQ_6pGK2QytE71viNJV7IVFABH_L7U4x8FcpFvOqHCQ9OxgKk1xBZQQZK-HGl_k1N_vfKdaaoc95JBGZXRfAO6x5Pa5XEUfuRV5jZCSAwxTZwt7h3SXMR9gpnY0sP_O5tKTUCnCqJyYBX9OVIUYHjWTTu1cfHJfQdUF6K70u1VYb720azdtT9BGxtdaIv3nUcw0kXZGwkWN0FCpwweKFzzvaC8MKFTwEI83Vt74SaRgemweAt0gDoBUwMHu2N__xU6IZLiEBnR"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-24 pb-32 md:max-w-5xl">
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary-dim">
              Performance Pulse
            </p>
            <h2 className="font-headline text-5xl leading-[0.88] font-black italic tracking-[-0.14em] md:text-7xl">
              READY TO
              <br />
              <span className="text-white/20">TRAIN?</span>
            </h2>
          </div>

          <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/3 p-6 shadow-ambient backdrop-blur-xl">
            <div className="relative z-10 flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#c1ed00"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={readinessOffset}
                    className="drop-shadow-[0_0_8px_rgba(209,255,38,0.4)]"
                  />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="font-headline text-4xl leading-none font-black italic tracking-[-0.12em]">
                    {readinessScore}
                  </strong>
                  <span className="mt-0.5 font-label text-[8px] font-bold uppercase tracking-[0.24em] text-primary-dim">
                    Excellent
                  </span>
                </div>
              </div>
              <div className="z-10 space-y-1 text-left">
                <h3 className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                  Readiness
                  <br />
                  Score
                </h3>
                <p className="max-w-xs text-sm text-on-surface-variant">
                  Your CNS is fully recovered. Optimal for high-intensity training today.
                </p>
              </div>
            </div>
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
          </article>
        </section>

        <section>
          <button
            className="flex w-full items-center justify-center gap-4 rounded-2xl bg-linear-to-r from-primary to-primary-container px-6 py-6 text-on-primary-fixed shadow-lime transition active:scale-[0.98]"
            type="button"
          >
            <span className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
              Start Workout
            </span>
            <Play className="h-6 w-6 fill-current" strokeWidth={2.4} />
          </button>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl bg-surface-container-low p-6 md:col-span-2">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary-dim">
                  Weekly Discipline
                </p>
                <h3 className="mt-1 font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                  Consistency
                  <br />
                  Streak
                </h3>
              </div>
              <div className="text-right">
                <span className="block font-headline text-2xl font-black italic text-primary-dim">5/7</span>
                <span className="block font-label text-[10px] font-bold uppercase text-on-surface-variant">
                  Days Active
                </span>
              </div>
            </div>

            <div className="flex h-16 items-end justify-between gap-2">
              {weeklyDiscipline.map((bar) => (
                <div key={`${bar.day}-${bar.height}`} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-full ${bar.height} ${
                      bar.active
                        ? 'bg-primary-dim shadow-[0_0_15px_rgba(209,255,38,0.5)]'
                        : 'bg-white/10'
                    }`}
                  />
                  <span
                    className={`font-label text-[10px] font-bold ${
                      bar.active ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-xl bg-surface-container-low p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-secondary shadow-[0_0_16px_rgba(0,227,253,0.5)]" />
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Planned Routine
                </p>
                <h3 className="mt-1 font-headline text-3xl font-black tracking-[-0.08em]">
                  PULL DAY
                </h3>
                <p className="mt-1 text-sm italic text-on-surface-variant">Back &amp; Biceps Focus</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-secondary" strokeWidth={2.4} />
            </div>
            <dl className="space-y-4 text-sm">
              {planStats.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-on-surface-variant">{label}</dt>
                  <dd className="font-label font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="rounded-xl bg-surface-container-low p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-tertiary">
                  Fuel Intake
                </p>
                <h3 className="mt-1 font-headline text-3xl font-black tracking-[-0.08em]">
                  NUTRITION
                </h3>
              </div>
              <div className="text-right">
                <strong className="block font-label text-2xl font-black">2,450</strong>
                <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  kcal left
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {macros.map((macro) => (
                <div key={macro.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 font-label text-[11px] font-bold uppercase tracking-[0.14em]">
                    <span className="text-on-surface-variant">{macro.name}</span>
                    <strong>
                      {macro.current} / {macro.target}
                    </strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                    <div className={`h-full rounded-full ${macro.tone}`} style={{ width: macro.width }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <BottomNav active="today" />
    </>
  );
}

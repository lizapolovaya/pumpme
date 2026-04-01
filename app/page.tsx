import {
  Bolt,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  Music4,
  Play,
  TrendingUp
} from 'lucide-react';

const readinessScore = 82;
const circumference = 2 * Math.PI * 88;
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

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

function getCurrentDayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function formatToday(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export default function Home() {
  const today = new Date();
  const currentDayIndex = getCurrentDayIndex(today);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Bolt className="h-5 w-5 text-primary-container" strokeWidth={2.2} />
            <h1 className="font-headline text-2xl font-black italic tracking-[-0.18em] text-primary-container">
              KINETIC
            </h1>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-on-primary-fixed"
            type="button"
            aria-label="Open profile"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-container font-label">
              LP
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-32 pt-8">
        <section className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary-dim">
              Performance Pulse
            </p>
            <h2 className="font-headline text-5xl leading-[0.88] font-black italic tracking-[-0.16em] md:text-7xl">
              READY TO
              <br />
              <span className="text-white/20">TRAIN?</span>
            </h2>
            <p className="font-label text-sm text-on-surface-variant">{formatToday(today)}</p>
          </div>

          <div className="relative mx-auto h-52 w-52 md:mx-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220" aria-hidden="true">
              <circle cx="110" cy="110" r="88" fill="none" stroke="#23262a" strokeWidth="12" />
              <circle
                cx="110"
                cy="110"
                r="88"
                fill="none"
                stroke="#d1ff26"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={readinessOffset}
                className="drop-shadow-[0_0_18px_rgba(209,255,38,0.24)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <strong className="font-label text-5xl font-black text-primary-container">
                {readinessScore}
              </strong>
              <span className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Score
              </span>
            </div>
          </div>
        </section>

        <section>
          <button
            className="flex w-full items-center justify-center gap-4 rounded-3xl bg-linear-to-r from-primary to-primary-container px-6 py-6 text-on-primary-fixed shadow-lime transition active:scale-[0.98]"
            type="button"
          >
            <span className="font-headline text-xl font-black italic uppercase tracking-[-0.06em]">
              Start Workout
            </span>
            <Play className="h-5 w-5 fill-current" strokeWidth={2.4} />
          </button>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 shadow-ambient">
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
              <Dumbbell className="h-5 w-5 text-secondary" strokeWidth={2.1} />
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

          <article className="rounded-3xl bg-surface-container-low p-6 shadow-ambient">
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

          <article className="rounded-3xl bg-surface-container-low p-6 shadow-ambient md:col-span-2">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Weekly Discipline
              </p>
              <div className="flex items-center gap-2 font-label text-lg font-black">
                <Flame className="h-5 w-5 fill-current text-primary-container" strokeWidth={2.2} />
                <strong>14 DAY STREAK</strong>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {days.map((day, index) => {
                const isDone = index < currentDayIndex;
                const isCurrent = index === currentDayIndex;
                const isUpcoming = index > currentDayIndex;

                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center gap-3 ${isUpcoming ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`font-label text-[10px] font-bold uppercase tracking-[0.14em] ${
                        isCurrent ? 'text-primary-container' : 'text-on-surface-variant'
                      }`}
                    >
                      {day}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isDone
                          ? 'bg-primary-container text-on-primary-fixed'
                          : isCurrent
                            ? 'border-2 border-primary-container bg-transparent'
                            : 'bg-surface-container-highest'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4" strokeWidth={2.8} />
                      ) : isCurrent ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary-container" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 rounded-t-[2rem] bg-surface-container-high/70 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          <a className="flex scale-110 flex-col items-center justify-center gap-1 text-primary-container" href="#">
            <Bolt className="h-5 w-5 fill-current" strokeWidth={2.2} />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]">Today</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-1 text-slate-500/70" href="#">
            <Dumbbell className="h-5 w-5" strokeWidth={2.1} />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]">
              Workouts
            </span>
          </a>
          <a className="flex flex-col items-center justify-center gap-1 text-slate-500/70" href="#">
            <CalendarDays className="h-5 w-5" strokeWidth={2.1} />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]">
              Calendar
            </span>
          </a>
          <a className="flex flex-col items-center justify-center gap-1 text-slate-500/70" href="#">
            <TrendingUp className="h-5 w-5" strokeWidth={2.1} />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]">
              Progress
            </span>
          </a>
        </div>
      </nav>

      <button
        className="fixed right-6 bottom-24 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-variant/60 text-primary-dim shadow-ambient backdrop-blur-2xl"
        type="button"
        aria-label="Music controls"
      >
        <Music4 className="h-5 w-5" strokeWidth={2.1} />
      </button>
    </>
  );
}

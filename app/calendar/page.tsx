import { CalendarDays, EllipsisVertical } from 'lucide-react';
import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';

type CalendarDay = {
  day: string;
  muted?: boolean;
  dots?: number;
  outlined?: boolean;
  accent?: boolean;
  intense?: boolean;
  selected?: boolean;
};

const calendarDays: CalendarDay[] = [
  { day: '25', muted: true },
  { day: '26', muted: true },
  { day: '27', muted: true },
  { day: '28', muted: true },
  { day: '29', muted: true },
  { day: '30', muted: true },
  { day: '1', dots: 1 },
  { day: '2' },
  { day: '3', outlined: true, accent: true, dots: 1 },
  { day: '4', dots: 1 },
  { day: '5' },
  { day: '6', intense: true, dots: 2 },
  { day: '7' },
  { day: '8' },
  { day: '9' },
  { day: '10', dots: 1 },
  { day: '11' },
  { day: '12', selected: true },
  { day: '13', dots: 1 },
  { day: '14' },
  { day: '15' },
  { day: '16' },
  { day: '17', dots: 1 },
  { day: '18' },
  { day: '19', dots: 1 },
  { day: '20' },
  { day: '21', intense: true, dots: 1 },
  { day: '22' }
];

const sessionDetails = [
  {
    name: 'Incline Bench Press',
    sets: '4 SETS',
    accent: 'border-secondary',
    stats: [
      ['Max Weight', '100KG'],
      ['Total Reps', '32']
    ]
  },
  {
    name: 'Weighted Dips',
    sets: '3 SETS',
    accent: 'border-primary-dim',
    stats: [
      ['Bodyweight +', '20KG'],
      ['Total Reps', '36']
    ]
  },
  {
    name: 'Lateral Raises',
    sets: '5 SETS',
    accent: 'border-tertiary',
    stats: [
      ['Weight', '15KG'],
      ['Total Reps', '75']
    ]
  }
] as const;

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function CalendarPage() {
  return (
    <>
      <AppHeader />

      <main className="mx-auto min-h-screen max-w-7xl px-4 pt-24 pb-28 md:px-8">
        <section className="mb-8 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="mb-2 flex items-end justify-between">
              <h2 className="font-headline text-4xl font-black tracking-[-0.08em] text-on-surface">
                OCTOBER <span className="font-light text-primary-dim/50">2023</span>
              </h2>
            </div>
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              Consistency: 84% • 22 Sessions logged
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-80">
            <article className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-4">
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                Weekly Volume
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl font-black text-secondary">42.5</span>
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Tons</span>
              </div>
            </article>
            <article className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-4">
              <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                Active Days
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl font-black text-primary-dim">5/7</span>
              </div>
            </article>
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-grow">
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                >
                  {label}
                </div>
              ))}

              {calendarDays.map((item) => {
                const baseClass = item.muted
                  ? 'bg-surface-container-low/20 opacity-20'
                  : item.selected
                    ? 'scale-105 z-10 bg-primary-container shadow-2xl'
                    : item.intense
                      ? 'border border-primary-dim/20 bg-primary-container/10'
                      : 'bg-surface-container-low hover:bg-surface-container-high';

                return (
                  <button
                    key={item.day}
                    type="button"
                    className={`relative aspect-square rounded-2xl transition-colors ${baseClass}`}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      <span
                        className={`font-label text-sm ${
                          item.selected
                            ? 'font-black text-on-primary-fixed'
                            : item.accent || item.intense
                              ? 'font-bold text-primary-dim'
                              : 'font-bold text-on-surface'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>

                    {item.outlined ? (
                      <div className="absolute inset-0 rounded-2xl border-2 border-primary-dim/30" />
                    ) : null}

                    {item.selected ? (
                      <div className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-dim opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-container" />
                      </div>
                    ) : null}

                    {item.dots ? (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                        {Array.from({ length: item.dots }).map((_, idx) => (
                          <div
                            key={`${item.day}-${idx}`}
                            className={`h-1.5 w-1.5 rounded-full bg-primary-dim ${
                              item.intense || item.outlined ? 'shadow-[0_0_8px_#D1FF26]' : ''
                            } ${item.accent ? 'opacity-100' : item.muted ? 'opacity-20' : item.day === '4' ? 'opacity-40' : ''}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:w-96">
            <section className="overflow-hidden rounded-[32px] bg-surface-container-high shadow-2xl">
              <div className="relative bg-surface-container-highest p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-primary-dim">
                      Oct 12, Thursday
                    </span>
                    <h3 className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                      Push Day Protocol
                    </h3>
                  </div>
                  <button type="button" aria-label="Session options" className="text-on-surface-variant">
                    <EllipsisVertical className="h-5 w-5" strokeWidth={2.1} />
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="font-label text-[10px] uppercase text-on-surface-variant">
                      Duration
                    </span>
                    <span className="font-headline text-lg font-bold">
                      74<span className="ml-1 text-xs font-normal">MIN</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label text-[10px] uppercase text-on-surface-variant">
                      Volume
                    </span>
                    <span className="font-headline text-lg font-bold">
                      12,400<span className="ml-1 text-xs font-normal">KG</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex max-h-[400px] flex-col gap-4 overflow-y-auto p-6">
                {sessionDetails.map((exercise) => (
                  <article
                    key={exercise.name}
                    className={`rounded-2xl border-l-4 bg-surface-container-low p-4 ${exercise.accent}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-label text-xs font-bold uppercase tracking-[0.14em] text-on-surface">
                        {exercise.name}
                      </h4>
                      <span className="font-label text-[10px] text-on-surface-variant">
                        {exercise.sets}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {exercise.stats.map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-background/40 p-2 text-center">
                          <span className="block font-label text-[8px] uppercase text-on-surface-variant">
                            {label}
                          </span>
                          <span className="font-headline text-sm font-bold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex gap-3 bg-surface-container-highest p-6">
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-primary-container py-3 font-headline text-sm font-black italic uppercase tracking-[-0.04em] text-on-primary-fixed transition-transform active:scale-95"
                >
                  Re-Run Session
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <div className="md:hidden">
        <BottomNav active="calendar" />
      </div>
    </>
  );
}

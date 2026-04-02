import { Bolt, Brain, ChevronDown, CircleHelp, Clock3, FileText, HeartPulse, MoveRight, TrendingUp } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';

type VolumeBar = {
  label: string;
  height: string;
  fill: string;
  outlined?: boolean;
  active?: boolean;
};

const volumeBars: VolumeBar[] = [
  { label: 'W1', height: 'h-24', fill: 'h-[60%]' },
  { label: 'W2', height: 'h-28', fill: 'h-[55%]' },
  { label: 'W3', height: 'h-32', fill: 'h-[65%]' },
  { label: 'W4', height: 'h-24', fill: 'h-[75%]' },
  { label: 'W5', height: 'h-40', fill: 'h-[70%]' },
  { label: 'W6', height: 'h-36', fill: 'h-[85%]', outlined: true },
  { label: 'W7', height: 'h-44', fill: 'h-[90%]', outlined: true },
  { label: 'W8', height: 'h-48', fill: 'h-full', active: true }
];

const oneRmStats = [
  ['Nov', '215'],
  ['Dec', '220'],
  ['Jan', '235'],
  ['Feb', '245']
] as const;

const performanceLogs = [
  {
    title: 'Relative Intensity (RPE) Average',
    subtitle: 'Last session intensity peaked at RPE 9.5',
    value: '8.2',
    status: 'Optimal Range',
    icon: TrendingUp,
    iconTone: 'text-secondary'
  },
  {
    title: 'Recovery Score',
    subtitle: 'Based on sleep and HRV data',
    value: '92%',
    status: 'High Readiness',
    icon: HeartPulse,
    iconTone: 'text-tertiary'
  }
] as const;

export default function ProgressPage() {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <Bolt className="h-5 w-5 text-primary-container" strokeWidth={2.2} />
          <h1 className="font-headline text-xl font-bold italic tracking-[-0.08em] text-primary-container">
            PumpMe
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container/20">
            <img
              alt="User avatar"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsEGb-JqNfRdqa1zhbmLt29xHSaqCIZds6IJ_hUXbCnuo9SqYB-Lp9NgRgIuP0NT5iGKqNNWwFAZ1QuTzx_YxDOoZ8eXvuvkV6t9rLX4C8qhTiBAJxEUKtraNuArP9v6CtsgUh6cX_mOlnAG0v9y7jV9CL2ybreJgX1qwzTKksJXNKPn3nPkoV5tBkRyBee_eU3E5Dyoq7j2WBQWOHovaLy7hvMfS3snlBbV7Y1qOJF4dKR9ikj4nwdgxVvds1i44dbnnaFSR-yIm9"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 pt-24 pb-32">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 font-label text-xs uppercase tracking-[0.2em] text-primary-dim">
              Performance Matrix
            </p>
            <h2 className="font-headline text-4xl font-black uppercase tracking-[-0.06em] text-on-surface">
              Progress <span className="text-primary-dim">Hub</span>
            </h2>
          </div>
          <div className="scrollbar-hidden flex items-center gap-3 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-high px-4 py-2 font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
              Last 30 Days
            </div>
            <div className="rounded-full bg-primary-container px-4 py-2 font-label text-xs font-bold uppercase tracking-[0.14em] text-on-primary-fixed shadow-lg shadow-primary-container/10">
              Export PDF
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="relative min-h-[220px] overflow-hidden rounded-xl bg-surface-container-low p-6 md:col-span-2">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-dim/10 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container">
                  <Brain className="h-4 w-4 text-on-primary-fixed" strokeWidth={2.1} />
                </div>
                <span className="font-label text-xs font-bold uppercase tracking-[0.18em]">
                  AI Coach Analysis
                </span>
              </div>
              <p className="mb-4 max-w-lg font-headline text-xl font-bold leading-tight">
                Great progression! You&apos;ve increased your bench volume by{' '}
                <span className="text-primary-dim">5% this week</span>.
              </p>
              <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant">
                Increase weight by <span className="font-bold text-on-surface">5 lbs</span> in your next
                session for progressive overload. Your recovery metrics suggest you&apos;re ready for
                higher intensity.
              </p>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-4">
              <button
                className="flex items-center gap-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-primary-dim transition-all hover:gap-2"
                type="button"
              >
                View Detailed Insights
                <MoveRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col rounded-xl bg-surface-container-low p-8">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <h3 className="mb-1 font-headline text-lg font-bold">Volume Trend</h3>
                <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Total Weight (LBS) / Weekly
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline text-2xl font-black text-primary-dim">42,500</p>
                <p className="font-label text-[10px] font-bold uppercase text-secondary">
                  +12.5% vs Last Week
                </p>
              </div>
            </div>
            <div className="relative flex h-48 flex-1 items-end justify-between gap-2">
              <div className="absolute inset-0 flex items-end opacity-20">
                <div className="absolute bottom-0 h-px w-full bg-outline-variant" />
                <div className="absolute bottom-1/3 h-px w-full bg-outline-variant" />
                <div className="absolute bottom-2/3 h-px w-full bg-outline-variant" />
              </div>
              {volumeBars.map((bar) => (
                <div
                  key={bar.label}
                  className={`relative flex-1 rounded-t-sm bg-surface-container-highest ${bar.height} ${
                    bar.outlined ? 'border-x border-primary-dim/10' : ''
                  } ${bar.active ? 'border-x border-primary-dim/30 bg-primary-container/20 shadow-[0_0_20px_rgba(209,255,38,0.15)]' : ''}`}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-t-sm ${
                      bar.active ? 'bg-primary-dim' : bar.outlined ? 'bg-primary-dim/50' : 'bg-primary-dim/30'
                    } ${bar.fill}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              {volumeBars.map((bar) => (
                <span
                  key={bar.label}
                  className={`font-label text-[10px] ${
                    bar.active ? 'font-bold text-primary-dim' : 'text-on-surface-variant'
                  }`}
                >
                  {bar.label}
                </span>
              ))}
            </div>
          </section>

          <section className="flex flex-col rounded-xl bg-surface-container-low p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-headline text-lg font-bold">Estimated 1RM</h3>
                  <CircleHelp className="h-4 w-4 text-on-surface-variant" strokeWidth={2.1} />
                </div>
                <div className="inline-flex items-center rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-1.5">
                  <span className="mr-4 text-xs font-bold text-on-surface">Bench Press</span>
                  <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2.1} />
                </div>
              </div>
              <div className="text-right">
                <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Current Peak
                </p>
                <p className="font-headline text-3xl font-black italic">
                  245 <span className="font-label text-sm uppercase not-italic">KG</span>
                </p>
              </div>
            </div>

            <div className="relative flex-1">
              <div className="chart-gradient relative h-48 w-full overflow-hidden rounded-bl-lg border-l border-b border-outline-variant/30">
                <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 400 200">
                  <path
                    d="M0 180C40 170 80 165 120 150C160 135 200 145 240 120C280 95 320 80 360 40C380 20 400 0 400 0"
                    stroke="#cefc22"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                  <circle cx="120" cy="150" r="4" fill="#0c0e11" stroke="#cefc22" strokeWidth="2" />
                  <circle cx="240" cy="120" r="4" fill="#0c0e11" stroke="#cefc22" strokeWidth="2" />
                  <circle cx="360" cy="40" r="6" fill="#cefc22" />
                </svg>
                <div className="absolute top-4 right-4 rounded bg-primary-container px-2 py-1 text-[10px] font-black uppercase text-on-primary-fixed shadow-lg">
                  +20lbs increase
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 text-center">
              {oneRmStats.map(([month, value], index) => (
                <div key={month} className={index < oneRmStats.length - 1 ? 'border-r border-outline-variant/10' : ''}>
                  <p
                    className={`font-label text-[10px] uppercase ${
                      month === 'Feb' ? 'font-bold text-primary-dim' : 'text-on-surface-variant'
                    }`}
                  >
                    {month}
                  </p>
                  <p className={`font-bold ${month === 'Feb' ? 'text-primary-dim' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            Performance Logs
          </h3>
          <div className="space-y-2">
            {performanceLogs.map((log) => {
              const Icon = log.icon;
              return (
                <article
                  key={log.title}
                  className={`flex items-center justify-between rounded-xl bg-surface-container-high p-4 ${
                    log.title.includes('RPE') ? 'border-l-4 border-secondary' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest">
                      <Icon className={`h-4 w-4 ${log.iconTone}`} strokeWidth={2.1} />
                    </div>
                    <div>
                      <p className="font-bold">{log.title}</p>
                      <p className="text-xs text-on-surface-variant">{log.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-headline text-lg font-bold ${log.title.includes('Recovery') ? 'text-tertiary' : ''}`}>
                      {log.value}
                    </p>
                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                      {log.status}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav active="progress" />
    </>
  );
}

import { Brain, ChevronDown, CircleHelp, Clock3, HeartPulse, MoveRight, TrendingUp } from 'lucide-react';
import { AppHeader } from '../components/app-header';
import { BottomNav } from '../components/bottom-nav';
import { createBackendServices, resolveCurrentUserContext } from '../../lib/server/backend';
import type { ProgressLogDto, ProgressPointDto } from '../../lib/server/backend/types';

type ChartPoint = {
  x: number;
  y: number;
};

function getVolumeBarFill(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return '12%';
  }

  return `${Math.max(12, Math.round((value / maxValue) * 100))}%`;
}

function buildLineChartPoints(points: ProgressPointDto[]): ChartPoint[] {
  if (!points.length) {
    return [];
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? 360 / (points.length - 1) : 0;

  return points.map((point, index) => ({
    x: 20 + step * index,
    y: 180 - Math.round((point.value / maxValue) * 140)
  }));
}

function buildLinePath(points: ChartPoint[]): string {
  if (!points.length) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');
}

function getVolumeDelta(currentValue: number, previousValue: number): string {
  if (previousValue <= 0) {
    return currentValue > 0 ? '+100.0% vs Prev Window' : 'No change vs Prev Window';
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const prefix = delta >= 0 ? '+' : '';
  return `${prefix}${delta.toFixed(1)}% vs Prev Week`;
}

function getCoachSummary(volumeTrend: ProgressPointDto[], oneRmTrend: ProgressPointDto[], logs: ProgressLogDto[]): string {
  const latestVolume = volumeTrend.at(-1)?.value ?? 0;
  const previousVolume = volumeTrend.at(-2)?.value ?? 0;
  const volumeDelta = previousVolume > 0 ? Math.round(((latestVolume - previousVolume) / previousVolume) * 100) : 0;
  const peakOneRm = oneRmTrend.at(-1)?.value ?? oneRmTrend[0]?.value ?? 0;
  const recoveryLog = logs.find((log) => log.title.includes('Recovery'));

  if (latestVolume > previousVolume) {
    return `Weekly volume is up ${volumeDelta}% and your estimated 1RM is now tracking at ${peakOneRm} kg. ${recoveryLog?.status ?? 'Recovery looks stable'}, so you can keep progressive overload on the next main lift.`;
  }

  if (latestVolume < previousVolume) {
    return `Volume dipped this window while estimated 1RM is holding near ${peakOneRm} kg. ${recoveryLog?.status ?? 'Recovery is stable'}, so prioritize cleaner top sets before adding load again.`;
  }

  return `Training output is stable and your estimated 1RM is holding near ${peakOneRm} kg. ${recoveryLog?.status ?? 'Recovery is stable'}, so keep intensity steady and look for better execution on primary sets.`;
}

function getCoachHeadline(volumeTrend: ProgressPointDto[]): string {
  const latestVolume = volumeTrend.at(-1)?.value ?? 0;
  const previousVolume = volumeTrend.at(-2)?.value ?? 0;

  if (latestVolume > previousVolume) {
    return 'Momentum is building.';
  }

  if (latestVolume < previousVolume) {
    return 'Progress is flattening.';
  }

  return 'Output is holding steady.';
}

function getLogIcon(log: ProgressLogDto) {
  if (log.title.includes('Recovery')) {
    return HeartPulse;
  }

  return TrendingUp;
}

function getLogTone(log: ProgressLogDto): string {
  if (log.title.includes('Recovery')) {
    return 'text-tertiary';
  }

  return 'text-secondary';
}

export default async function ProgressPage() {
  const { userId } = await resolveCurrentUserContext();
  const services = createBackendServices(userId);
  const summary = await services.analytics.getProgress('30d');
  const volumeBars = summary.volumeTrend;
  const oneRmStats = summary.oneRmTrend;
  const linePoints = buildLineChartPoints(oneRmStats);
  const linePath = buildLinePath(linePoints);
  const volumeMax = Math.max(...volumeBars.map((bar) => bar.value), 1);
  const latestVolume = volumeBars.at(-1)?.value ?? 0;
  const previousVolume = volumeBars.at(-2)?.value ?? 0;
  const currentPeak = oneRmStats.at(-1)?.value ?? 0;
  const coachHeadline = getCoachHeadline(volumeBars);
  const coachSummary = getCoachSummary(volumeBars, oneRmStats, summary.logs);

  return (
    <>
      <AppHeader />

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
                {coachHeadline}{' '}
                <span className="text-primary-dim">{latestVolume.toLocaleString('en-US')} kg</span> logged in the
                latest week.
              </p>
              <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant">
                {coachSummary}
              </p>
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-4">
              <a
                className="flex items-center gap-1 font-label text-xs font-bold uppercase tracking-[0.18em] text-primary-dim transition-all hover:gap-2"
                href="#performance-logs"
              >
                View Detailed Insights
                <MoveRight className="h-3.5 w-3.5" strokeWidth={2.2} />
              </a>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col rounded-xl bg-surface-container-low p-8">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <h3 className="mb-1 font-headline text-lg font-bold">Volume Trend</h3>
                <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Total Weight (KG) / Weekly
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline text-2xl font-black text-primary-dim">
                  {latestVolume.toLocaleString('en-US')}
                </p>
                <p className="font-label text-[10px] font-bold uppercase text-secondary">
                  {getVolumeDelta(latestVolume, previousVolume)}
                </p>
              </div>
            </div>
            <div className="relative flex h-48 flex-1 items-end justify-between gap-2">
              <div className="absolute inset-0 flex items-end opacity-20">
                <div className="absolute bottom-0 h-px w-full bg-outline-variant" />
                <div className="absolute bottom-1/3 h-px w-full bg-outline-variant" />
                <div className="absolute bottom-2/3 h-px w-full bg-outline-variant" />
              </div>
              {volumeBars.map((bar, index) => {
                const isActive = index === volumeBars.length - 1;
                const isRecent = index >= volumeBars.length - 3;

                return (
                  <div
                    key={bar.label}
                    className={`relative flex-1 rounded-t-sm bg-surface-container-highest h-full ${
                      isRecent ? 'border-x border-primary-dim/10' : ''
                    } ${isActive ? 'border-x border-primary-dim/30 bg-primary-container/20 shadow-[0_0_20px_rgba(209,255,38,0.15)]' : ''}`}
                  >
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm ${
                        isActive ? 'bg-primary-dim' : isRecent ? 'bg-primary-dim/50' : 'bg-primary-dim/30'
                      }`}
                      style={{ height: getVolumeBarFill(bar.value, volumeMax) }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between gap-2">
              {volumeBars.map((bar, index) => (
                <span
                  key={bar.label}
                  className={`font-label text-[10px] ${
                    index === volumeBars.length - 1 ? 'font-bold text-primary-dim' : 'text-on-surface-variant'
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
                  <span className="mr-4 text-xs font-bold text-on-surface">Primary Lift</span>
                  <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={2.1} />
                </div>
              </div>
              <div className="text-right">
                <p className="font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                  Current Peak
                </p>
                <p className="font-headline text-3xl font-black italic">
                  {currentPeak}{' '}
                  <span className="font-label text-sm uppercase not-italic">KG</span>
                </p>
              </div>
            </div>

            <div className="relative flex-1">
              <div className="chart-gradient relative h-48 w-full overflow-hidden rounded-bl-lg border-l border-b border-outline-variant/30">
                <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 400 200">
                  {linePath ? (
                    <path
                      d={linePath}
                      stroke="#cefc22"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                  ) : null}
                  {linePoints.map((point, index) => (
                    <circle
                      key={`${point.x}-${point.y}`}
                      cx={point.x}
                      cy={point.y}
                      r={index === linePoints.length - 1 ? 6 : 4}
                      fill={index === linePoints.length - 1 ? '#cefc22' : '#0c0e11'}
                      stroke="#cefc22"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="absolute top-4 right-4 rounded bg-primary-container px-2 py-1 text-[10px] font-black uppercase text-on-primary-fixed shadow-lg">
                  {oneRmStats.length > 1 ? `${currentPeak - (oneRmStats.at(-2)?.value ?? currentPeak)}kg change` : 'Tracked peak'}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 text-center">
              {oneRmStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={index < oneRmStats.length - 1 ? 'border-r border-outline-variant/10' : ''}
                >
                  <p
                    className={`font-label text-[10px] uppercase ${
                      index === oneRmStats.length - 1 ? 'font-bold text-primary-dim' : 'text-on-surface-variant'
                    }`}
                  >
                    {stat.label}
                  </p>
                  <p className={index === oneRmStats.length - 1 ? 'font-bold text-primary-dim' : 'font-bold'}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section id="performance-logs" className="space-y-4">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            Performance Logs
          </h3>
          <div className="space-y-2">
            {summary.logs.map((log) => {
              const Icon = getLogIcon(log);
              const iconTone = getLogTone(log);
              return (
                <article
                  key={log.title}
                  className={`flex items-center justify-between rounded-xl bg-surface-container-high p-4 ${
                    log.title.includes('RPE') ? 'border-l-4 border-secondary' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest">
                      <Icon className={`h-4 w-4 ${iconTone}`} strokeWidth={2.1} />
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

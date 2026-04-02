import {
  Activity,
  Bolt,
  CirclePlus,
  Dumbbell,
  EllipsisVertical,
  PencilLine,
  Scale,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { BottomNav } from '../components/bottom-nav';

const statCards = [
  {
    label: 'Estimated Burn',
    value: '342',
    unit: 'KCAL',
    accent: 'text-primary-container',
    icon: Activity
  },
  {
    label: 'Total Volume',
    value: '12,450',
    unit: 'KG',
    accent: 'text-secondary',
    icon: Scale
  }
] as const;

const exercises = [
  {
    name: 'Bench Press',
    accent: 'border-secondary',
    iconTone: 'text-secondary',
    addTone: 'hover:border-secondary/50 hover:bg-secondary/5',
    icon: Dumbbell,
    sets: [
      { set: '1', weight: '80', reps: '10', rpe: '8', accent: 'text-secondary accent-secondary' },
      { set: '2', weight: '80', reps: '10', rpe: '7', accent: 'text-secondary accent-secondary' }
    ]
  },
  {
    name: 'Tricep Pushdowns',
    accent: 'border-primary-container',
    iconTone: 'text-primary-container',
    addTone: 'hover:border-primary-container/50 hover:bg-primary-container/5',
    icon: TrendingUp,
    sets: [{ set: '1', weight: '25', reps: '15', rpe: '9', accent: 'text-primary-container accent-primary-container' }]
  }
] as const;

export default function WorkoutsPage() {
  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-container-low">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4 md:max-w-5xl">
          <div className="flex items-center gap-3">
            <Bolt className="h-5 w-5 text-primary-container" strokeWidth={2.2} />
            <h1 className="font-headline text-xl font-bold italic uppercase tracking-[-0.08em] text-primary-container">
              PumpMe
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" aria-label="Open profile" className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container/20">
              <img
                alt="User avatar"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFH4t9ym2kJYY3TZ0ZLqSKc-lA927A-vr-1_tJsPSm7YfjtMKMOntJum6ahswAxawLYNbrNabyCTpYqJ-0Su4Q3bDirpbkG0q1aJgIk7ltTOarHFjg279CJzxeXyfV-WTyuHpfEqBPNq51NcbuuFFLbQ0Pp6WgXmeh_L3Ctu4Fi31jL_DFJrTIWcI9psnWECdMk6TmrxNuuYB4brILdeRmMD1WU5v5fwUzDBpZKCwMJ3ySFQ4Bzovx3x6n0mk9LT9F9e7pXrWzvZxf"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 pb-32 md:max-w-2xl">
        <header className="mb-8">
          <p className="mb-1 font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Monday, Oct 23
          </p>
          <h1 className="flex items-center gap-3 font-headline text-4xl font-black italic tracking-[-0.08em] text-on-surface">
            Chest &amp; Triceps
            <PencilLine className="h-5 w-5 text-primary-container" strokeWidth={2.3} />
          </h1>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="group relative overflow-hidden rounded-xl bg-surface-container-high p-5"
              >
                <div className="absolute -top-4 -right-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <Icon className="h-20 w-20" strokeWidth={1.5} />
                </div>
                <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  {card.label}
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`font-headline text-3xl font-extrabold ${card.accent}`}>{card.value}</span>
                  <span className="font-label text-sm font-medium text-on-surface-variant">{card.unit}</span>
                </div>
              </article>
            );
          })}
        </section>

        <div className="space-y-6">
          {exercises.map((exercise) => {
            const Icon = exercise.icon;
            return (
              <section
                key={exercise.name}
                className={`overflow-hidden rounded-xl border-l-4 bg-surface-container-low ${exercise.accent}`}
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest ${exercise.iconTone}`}>
                      <Icon className="h-4 w-4" strokeWidth={2.1} />
                    </div>
                    <h3 className="font-headline text-xl font-bold text-on-surface">{exercise.name}</h3>
                  </div>
                  <button className="text-on-surface-variant transition-colors hover:text-on-surface" type="button" aria-label={`Exercise menu for ${exercise.name}`}>
                    <EllipsisVertical className="h-4 w-4" strokeWidth={2.1} />
                  </button>
                </div>

                <div className="px-5 pb-5">
                  <div className="mb-3 grid grid-cols-12 gap-2 px-2">
                    <div className="col-span-2 font-label text-[10px] font-bold uppercase text-on-surface-variant">Set</div>
                    <div className="col-span-3 font-label text-[10px] font-bold uppercase text-on-surface-variant">Weight Kg</div>
                    <div className="col-span-3 font-label text-[10px] font-bold uppercase text-on-surface-variant">Reps</div>
                    <div className="col-span-4 text-right font-label text-[10px] font-bold uppercase text-on-surface-variant">RPE</div>
                  </div>

                  <div className="space-y-2">
                    {exercise.sets.map((set) => (
                      <div
                        key={`${exercise.name}-${set.set}`}
                        className="grid grid-cols-12 items-center gap-2 rounded-lg bg-surface-container-lowest/50 p-2"
                      >
                        <div className="col-span-2 font-label font-bold text-on-surface-variant">{set.set}</div>
                        <div className="col-span-3">
                          <input
                            className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                            type="number"
                            defaultValue={set.weight}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            className="w-full rounded-lg border-none bg-surface-container-highest text-center font-label text-sm focus:ring-1 focus:ring-primary-dim"
                            type="number"
                            defaultValue={set.reps}
                          />
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-2">
                          <span className={`font-label text-xs font-medium ${set.accent.split(' ')[0]}`}>{set.rpe}</span>
                          <input className={`w-20 ${set.accent.split(' ')[1]}`} type="range" min="1" max="10" defaultValue={set.rpe} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant py-3 font-label text-sm font-bold text-on-surface-variant transition-all ${exercise.addTone}`}
                    type="button"
                  >
                    <CirclePlus className="h-4 w-4" strokeWidth={2.1} />
                    Add Set
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <button
          className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-high py-5 font-headline font-bold text-primary-container transition-transform active:scale-95"
          type="button"
        >
          <span className="rounded-full bg-primary-container p-1 text-on-primary-fixed transition-transform group-hover:rotate-90">
            <CirclePlus className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Add Exercise
        </button>

        <div className="mt-12 mb-10">
          <button
            className="w-full rounded-xl bg-linear-to-br from-primary to-primary-container py-4 font-headline text-lg font-black uppercase tracking-[0.08em] text-on-primary-fixed shadow-lg shadow-primary-container/20 transition-all active:scale-95"
            type="button"
          >
            Finish Workout
          </button>
        </div>
      </main>

      <BottomNav active="workouts" />
    </>
  );
}

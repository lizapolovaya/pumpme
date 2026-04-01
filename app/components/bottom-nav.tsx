import Link from 'next/link';
import { Bolt, CalendarDays, Dumbbell, TrendingUp } from 'lucide-react';

type BottomNavProps = {
  active: 'today' | 'workouts';
};

const itemBase =
  'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 active:scale-90';

export function BottomNav({ active }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl bg-background/90 backdrop-blur-xl shadow-[0px_-20px_40px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex w-full max-w-md justify-around px-4 pt-3 pb-6 md:max-w-5xl">
        <Link
          href="/"
          className={`${itemBase} ${
            active === 'today' ? 'text-primary-container' : 'text-slate-500 hover:text-primary-container'
          }`}
        >
          <Bolt className={`h-5 w-5 ${active === 'today' ? 'fill-current' : ''}`} strokeWidth={2.2} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">Today</span>
        </Link>
        <Link
          href="/workouts"
          className={`${itemBase} ${
            active === 'workouts'
              ? 'rounded-xl bg-surface-container-high text-primary-container'
              : 'text-slate-500 hover:text-primary-container'
          }`}
        >
          <Dumbbell className="h-5 w-5" strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Workouts
          </span>
        </Link>
        <a className={`${itemBase} text-slate-500 hover:text-primary-container`} href="#">
          <CalendarDays className="h-5 w-5" strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Calendar
          </span>
        </a>
        <a className={`${itemBase} text-slate-500 hover:text-primary-container`} href="#">
          <TrendingUp className="h-5 w-5" strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Progress
          </span>
        </a>
      </div>
    </div>
  );
}

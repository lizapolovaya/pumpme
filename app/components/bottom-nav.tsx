import Link from 'next/link';
import { Bolt, CalendarDays, Dumbbell, TrendingUp, User } from 'lucide-react';

type BottomNavProps = {
  active: 'today' | 'workouts' | 'calendar' | 'progress' | 'profile';
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
        <Link
          href="/calendar"
          className={`${itemBase} ${
            active === 'calendar'
              ? 'rounded-xl bg-surface-container-high text-primary-container'
              : 'text-slate-500 hover:text-primary-container'
          }`}
        >
          <CalendarDays className={`h-5 w-5 ${active === 'calendar' ? 'fill-current' : ''}`} strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Calendar
          </span>
        </Link>
        <Link
          href="/progress"
          className={`${itemBase} ${
            active === 'progress'
              ? 'rounded-xl bg-surface-container-high text-primary-container'
              : 'text-slate-500 hover:text-primary-container'
          }`}
        >
          <TrendingUp className={`h-5 w-5 ${active === 'progress' ? 'fill-current' : ''}`} strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Progress
          </span>
        </Link>
        <Link
          href="/profile"
          className={`${itemBase} ${
            active === 'profile'
              ? 'rounded-xl bg-surface-container-high text-primary-container'
              : 'text-slate-500 hover:text-primary-container'
          }`}
        >
          <User className={`h-5 w-5 ${active === 'profile' ? 'fill-current' : ''}`} strokeWidth={2.1} />
          <span className="font-headline text-[10px] font-medium uppercase tracking-[0.18em]">
            Profile
          </span>
        </Link>
      </div>
    </div>
  );
}

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    ArrowRight,
    CalendarDays,
    Dumbbell,
    Lock,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Utensils
} from 'lucide-react';

const heroImage =
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2200&q=85';

type FeatureCard = {
    body: string;
    className?: string;
    href: string;
    icon: LucideIcon;
    points?: readonly string[];
    title: string;
};

const featureCards: FeatureCard[] = [
    {
        body: 'The Today dashboard consolidates readiness, planned volume, nutrition, and consistency into one actionable view.',
        className: 'lg:col-span-2',
        href: '/app',
        icon: Activity,
        points: ['Readiness score integration', 'Upcoming session highlights', 'Weekly goal tracking'],
        title: 'Start each training day with the full picture'
    },
    {
        body: 'Fast set entry for exercises, weight, reps, and RPE, designed for mid-workout use.',
        href: '/workouts',
        icon: Dumbbell,
        title: 'Log workouts without slowing down'
    },
    {
        body: 'Spot gaps in consistency and browse logged sessions across previous and future months.',
        href: '/calendar',
        icon: CalendarDays,
        title: 'Visual training calendar'
    },
    {
        body: 'Turn months of progress data into your next session targets with volume trends and lift-specific estimated 1RM.',
        className: 'lg:col-span-2',
        href: '/progress',
        icon: TrendingUp,
        title: 'Data into decisions'
    }
];

const differentiators = [
    {
        body: 'Most apps track the past. PumpMe uses the past to help you decide what to do next.',
        title: 'Decision focus'
    },
    {
        body: 'The logging flow stays focused on the details that matter in the gym: lift, load, reps, and effort.',
        title: 'Zero friction'
    },
    {
        body: 'Review weekly volume, estimated 1RM, recovery context, and average RPE without a noisy social layer.',
        title: 'Deep analytics'
    }
] as const;

const faqs = [
    {
        answer:
            'PumpMe is a workout tracking app that combines readiness, workout logging, nutrition targets, a calendar, and progress analytics in one focused dashboard.',
        question: 'What is PumpMe?'
    },
    {
        answer:
            'Yes. PumpMe lets you add exercises and record sets with weight, reps, and RPE so your workout history captures both performance and effort.',
        question: 'Can I log sets, weight, reps, and RPE?'
    },
    {
        answer:
            'Yes. PumpMe shows weekly volume trends, lift-specific estimated 1RM charts, recovery context, average RPE interpretation, and next-session load targets.',
        question: 'Does PumpMe include progress analytics?'
    }
] as const;

export default function Home() {
    return (
        <main className="min-h-screen bg-background text-on-surface">
            <nav className="fixed inset-x-0 top-0 z-40 bg-background/95 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-12">
                    <Link className="font-headline text-3xl font-black italic text-primary-dim" href="/">
                        PUMPME
                    </Link>
                    <div className="hidden items-center gap-12 font-label text-[11px] font-bold uppercase tracking-[0.32em] text-on-surface-variant md:flex">
                        <Link className="text-primary-dim" href="/app">
                            Today
                        </Link>
                        <Link className="transition hover:text-primary-dim" href="/workouts">
                            Workouts
                        </Link>
                        <Link className="transition hover:text-primary-dim" href="/calendar">
                            Calendar
                        </Link>
                        <Link className="transition hover:text-primary-dim" href="/progress">
                            Progress
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link aria-label="Search" className="hidden text-on-surface-variant transition hover:text-primary-dim md:block" href="/help">
                            <Search className="h-5 w-5" strokeWidth={2.2} />
                        </Link>
                        <Link
                            className="rounded-full border border-primary-dim/30 bg-surface-container-high px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary-dim md:px-5"
                            href="/app"
                        >
                            Open App
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="relative flex min-h-[860px] items-center overflow-hidden pt-20">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-45"
                    style={{ backgroundImage: `url(${heroImage})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#0c0e11_0%,rgba(12,14,17,0.94)_34%,rgba(12,14,17,0.62)_66%,rgba(12,14,17,0.9)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 md:px-12">
                    <p className="inline-flex rounded-full bg-surface-container-high px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary-dim md:px-5">
                        Workout logging built around today's training decision.
                    </p>
                    <h1 className="mt-8 max-w-5xl font-headline text-5xl font-black italic uppercase leading-[0.95] text-on-surface md:text-7xl lg:text-8xl">
                        Track every workout, understand your{' '}
                        <span className="text-primary-dim drop-shadow-[0_0_24px_rgba(193,237,0,0.35)]">readiness</span>, and make your
                        next session count.
                    </h1>
                    <p className="mt-8 max-w-2xl text-lg leading-8 text-on-surface-variant md:text-xl">
                        A focused training companion for lifters who treat every rep as data. Log sessions quickly, keep nutrition
                        close, and turn progress review into practical next-session targets.
                    </p>
                    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                        <Link
                            className="inline-flex min-h-16 items-center justify-center rounded-xl bg-linear-to-r from-primary to-primary-container px-8 font-headline text-sm font-black uppercase text-on-primary-fixed transition active:scale-[0.98]"
                            href="/app"
                        >
                            Start tracking your training
                        </Link>
                        <Link
                            className="inline-flex min-h-16 items-center justify-center rounded-xl bg-surface-container-high px-8 font-headline text-sm font-black uppercase text-on-surface transition hover:bg-surface-bright"
                            href="#features"
                        >
                            View how PumpMe works
                        </Link>
                    </div>
                    <p className="mt-8 font-label text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                        Web app first - private by design - optional Google activity sync
                    </p>
                </div>
            </section>

            <section id="features" className="bg-surface-container-low py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-5 md:px-12">
                    <div className="max-w-3xl">
                        <h2 className="font-headline text-4xl font-black italic uppercase leading-tight text-on-surface md:text-5xl">
                            Built for <span className="text-secondary">precision</span>
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                            Everything you need to optimize your training cycle without the friction of traditional trackers.
                        </p>
                    </div>

                    <div className="mt-20 grid gap-6 lg:grid-cols-3">
                        {featureCards.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <Link
                                    className={`group flex min-h-[340px] flex-col justify-between rounded-[2rem] bg-surface-container-high p-8 transition duration-200 hover:-translate-y-1 hover:bg-surface-bright ${feature.className ?? ''}`}
                                    href={feature.href}
                                    key={feature.title}
                                >
                                    <div>
                                        <Icon className="h-8 w-8 text-primary-dim" strokeWidth={2.2} />
                                        <h3 className="mt-8 max-w-xl font-headline text-3xl font-black italic uppercase leading-tight text-on-surface">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-6 max-w-xl text-base leading-7 text-on-surface-variant">{feature.body}</p>
                                    </div>
                                    {feature.points ? (
                                        <ul className="mt-8 space-y-3 font-label text-[12px] uppercase tracking-[0.12em] text-on-surface">
                                            {feature.points.map((point) => (
                                                <li className="flex items-center gap-3" key={point}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="mt-8 inline-flex items-center gap-2 font-label text-[11px] font-bold uppercase tracking-[0.2em] text-primary-dim">
                                            Explore
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-background py-24 md:py-32">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-12 lg:grid-cols-2">
                    <article className="rounded-[2rem] border-l-2 border-secondary bg-surface-container-low p-8 md:p-12">
                        <Utensils className="h-8 w-8 text-secondary" strokeWidth={2.2} />
                        <h3 className="mt-10 font-headline text-3xl font-black italic uppercase leading-tight text-on-surface md:text-4xl">
                            Keep nutrition targets next to your training plan
                        </h3>
                        <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                            Review calories and macros from the same product loop as your readiness, workout plan, and progress review.
                        </p>
                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-surface-container-high p-6 text-center">
                                <strong className="block font-headline text-3xl text-on-surface">2,800</strong>
                                <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                    Target kcal
                                </span>
                            </div>
                            <div className="rounded-xl bg-surface-container-high p-6 text-center">
                                <strong className="block font-headline text-3xl text-secondary">185g</strong>
                                <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                                    Protein
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border-l-2 border-primary-dim bg-surface-container-low p-8 md:p-12">
                        <Lock className="h-8 w-8 text-primary-dim" strokeWidth={2.2} />
                        <h3 className="mt-10 font-headline text-3xl font-black italic uppercase leading-tight text-on-surface md:text-4xl">
                            Private by default, connected when useful
                        </h3>
                        <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                            PumpMe is built around a single authenticated account, not a public feed. Connect activity data only when
                            it adds useful context.
                        </p>
                        <div className="mt-10 flex items-center gap-4 font-label text-[12px] font-bold uppercase tracking-[0.18em] text-primary-dim">
                            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                            Account controls and privacy pages
                        </div>
                    </article>
                </div>
            </section>

            <section className="bg-black py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-5 text-center md:px-12">
                    <h2 className="mx-auto max-w-4xl font-headline text-4xl font-black italic uppercase leading-tight text-on-surface md:text-5xl">
                        A workout tracker for people who care about the <span className="text-primary-dim">next session</span>
                    </h2>
                    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">
                        PumpMe removes the social noise and keeps the loop focused: check readiness, train, log, review, adjust.
                    </p>
                    <div className="mt-20 grid gap-10 text-left md:grid-cols-3">
                        {differentiators.map((item) => (
                            <article key={item.title}>
                                <h3 className="font-headline text-2xl font-black italic uppercase text-primary-dim">{item.title}</h3>
                                <p className="mt-5 text-base leading-7 text-on-surface-variant">{item.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-surface-container-low py-24 md:py-32">
                <div className="mx-auto max-w-4xl px-5 md:px-12">
                    <h2 className="text-center font-headline text-4xl font-black italic uppercase text-on-surface md:text-5xl">
                        Frequently asked questions
                    </h2>
                    <div className="mt-14 space-y-5">
                        {faqs.map((faq) => (
                            <article className="rounded-2xl bg-background p-8" key={faq.question}>
                                <div className="flex items-start justify-between gap-6">
                                    <h3 className="font-headline text-xl font-black italic uppercase leading-snug text-on-surface">
                                        {faq.question}
                                    </h3>
                                    <Sparkles className="h-5 w-5 shrink-0 text-primary-dim" strokeWidth={2.2} />
                                </div>
                                <p className="mt-6 text-base leading-7 text-on-surface-variant">{faq.answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-background px-5 py-24 text-center md:px-12 md:py-32">
                <h2 className="mx-auto max-w-4xl font-headline text-4xl font-black italic uppercase leading-tight text-on-surface md:text-6xl">
                    Ready to make every <span className="text-primary-dim">session</span> count?
                </h2>
                <Link
                    className="mt-10 inline-flex min-h-16 items-center justify-center rounded-xl bg-linear-to-r from-primary to-primary-container px-10 font-headline text-base font-black uppercase text-on-primary-fixed"
                    href="/app"
                >
                    Start tracking
                </Link>
            </section>

            <footer className="bg-black px-5 py-16 md:px-12">
                <div className="mx-auto grid max-w-7xl gap-12 border-b border-outline-variant/15 pb-14 md:grid-cols-[1.3fr_1fr]">
                    <div>
                        <Link className="font-headline text-4xl font-black italic text-primary-dim" href="/">
                            PUMPME
                        </Link>
                        <p className="mt-6 max-w-sm text-base leading-7 text-on-surface-variant">
                            A kinetic training dashboard for workout logging, readiness context, and practical progress review.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 font-label text-[12px] uppercase tracking-[0.12em]">
                        <div className="space-y-4">
                            <h3 className="text-on-surface">Product</h3>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/app">
                                Today view
                            </Link>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/workouts">
                                Logger
                            </Link>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/progress">
                                Analytics
                            </Link>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-on-surface">Company</h3>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/privacy">
                                Privacy
                            </Link>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/help">
                                Help
                            </Link>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-on-surface">Support</h3>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/login">
                                Login
                            </Link>
                            <Link className="block text-on-surface-variant hover:text-primary-dim" href="/calendar">
                                Calendar
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant md:flex-row md:justify-between">
                    <p>2026 PumpMe. All rights reserved.</p>
                    <p>Designed for performance - built for privacy</p>
                </div>
            </footer>
        </main>
    );
}

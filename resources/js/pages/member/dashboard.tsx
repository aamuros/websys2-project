import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Check, CircleCheck, Clock3, Droplets, MapPin, Megaphone, Sprout, Sun } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

const schedule = [
    { day: '19', month: 'SEP', title: 'Community workday', detail: 'Saturday · 8:00 AM–10:30 AM', location: 'Tool shed meeting point', label: 'Registered' },
    { day: '24', month: 'SEP', title: 'Plot check-in', detail: 'Thursday · 4:30 PM', location: 'Plot A-14', label: 'Upcoming' },
    { day: '03', month: 'OCT', title: 'Seed sharing morning', detail: 'Saturday · 9:00 AM–11:00 AM', location: 'Community pavilion', label: 'Optional' },
];

const updates = [
    { title: 'Watering hours were updated', detail: 'Morning access now begins at 6:00 AM.', time: '2 hours ago' },
    { title: 'Fresh compost is available', detail: 'Use the marked bays beside the tool shed.', time: 'Yesterday' },
];

const activity = [
    { title: 'Community workday registration', detail: 'Saturday, September 19', status: 'Confirmed' },
    { title: 'Plot renewal request', detail: 'Submitted September 12', status: 'In review' },
    { title: 'Garden orientation', detail: 'Completed September 5', status: 'Complete' },
];

export default function MemberDashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there';

    return (
        <>
            <Head title="Member dashboard" />
            <AppLayout title="Member dashboard" description="Track your plot requests and assignments from one personal workspace.">
                <div className="space-y-10 pb-12">
                    <section aria-labelledby="plot-overview-title" className="overflow-hidden rounded-[22px] border border-primary/10 bg-card shadow-[0_10px_32px_rgba(64,79,29,0.05)]">
                        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
                            <div className="p-6 sm:p-8 lg:p-10">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-xs font-semibold text-primary"><CircleCheck className="size-3.5" aria-hidden="true" />Active assignment</span>
                                    <span className="text-xs font-medium text-muted-foreground">2026 growing season</span>
                                </div>
                                <p className="mt-8 text-sm font-medium text-muted-foreground">Welcome back, {firstName}</p>
                                <h2 id="plot-overview-title" className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Your plot is ready for the week.</h2>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Plot A-14 is in good standing. Your next scheduled garden activity is the community workday this Saturday.</p>
                                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                                    <Link href="/assignments" className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_5px_rgba(64,79,29,0.16)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">View plot details<ArrowRight className="size-4" aria-hidden="true" /></Link>
                                    <Link href="/garden-calendar" className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-primary/15 bg-background/45 px-4 text-sm font-semibold text-foreground transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"><CalendarDays className="size-4" aria-hidden="true" />Open calendar</Link>
                                </div>
                            </div>
                            <div className="border-t border-primary/10 bg-primary/[0.045] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                                <div className="flex items-start justify-between gap-5">
                                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your garden</p><p className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground">Plot A-14</p><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" />North garden · Raised bed</p></div>
                                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"><Sprout className="size-5 stroke-[1.8]" aria-hidden="true" /></span>
                                </div>
                                <dl className="mt-9 divide-y divide-primary/10 border-y border-primary/10">
                                    <div className="flex items-center justify-between gap-4 py-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Droplets className="size-4" aria-hidden="true" />Watering hours</dt><dd className="text-right text-sm font-semibold text-foreground">6–9 AM · 4–7 PM</dd></div>
                                    <div className="flex items-center justify-between gap-4 py-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Sun className="size-4" aria-hidden="true" />Season ends</dt><dd className="text-right text-sm font-semibold text-foreground">October 31</dd></div>
                                </dl>
                                <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-muted-foreground"><Check className="size-3.5 shrink-0" aria-hidden="true" />No actions are required right now.</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)] lg:gap-12">
                        <section aria-labelledby="schedule-title">
                            <div className="flex items-end justify-between gap-4 border-b border-border pb-4"><div><h2 id="schedule-title" className="text-lg font-semibold tracking-[-0.02em] text-foreground">Upcoming schedule</h2><p className="mt-1 text-sm text-muted-foreground">Your next garden dates in one place.</p></div><Link href="/garden-calendar" className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">View all</Link></div>
                            <div className="divide-y divide-border" role="list">
                                {schedule.map((item) => (
                                    <Link key={`${item.month}-${item.day}`} href="/garden-calendar" className="group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-5 transition-colors hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:px-2" role="listitem">
                                        <span className="text-center" aria-hidden="true"><span className="block text-[10px] font-bold tracking-[0.14em] text-muted-foreground">{item.month}</span><span className="mt-0.5 block text-xl font-semibold leading-6 text-foreground">{item.day}</span></span>
                                        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{item.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground sm:text-sm">{item.detail}</span><span className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground/80 sm:hidden"><MapPin className="size-3 shrink-0" aria-hidden="true" />{item.location}</span></span>
                                        <span className="flex items-center gap-5"><span className="hidden text-right sm:block"><span className="block text-xs font-medium text-foreground">{item.label}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden="true" />{item.location}</span></span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                        <aside aria-labelledby="updates-title" className="lg:border-l lg:border-border lg:pl-10">
                            <div className="flex items-center justify-between gap-4 border-b border-border pb-4"><div><h2 id="updates-title" className="text-lg font-semibold tracking-[-0.02em] text-foreground">Garden updates</h2><p className="mt-1 text-sm text-muted-foreground">News that affects your plot.</p></div><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary"><Megaphone className="size-4" aria-hidden="true" /></span></div>
                            <div className="divide-y divide-border">{updates.map((item) => <article key={item.title} className="py-5"><p className="text-sm font-semibold leading-5 text-foreground">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/75"><Clock3 className="size-3" aria-hidden="true" />{item.time}</p></article>)}</div>
                            <Link href="/community-updates" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">See all community updates<ArrowRight className="size-4" aria-hidden="true" /></Link>
                        </aside>
                    </div>

                    <section aria-labelledby="activity-title">
                        <div className="border-b border-border pb-4"><h2 id="activity-title" className="text-lg font-semibold tracking-[-0.02em] text-foreground">Recent activity</h2><p className="mt-1 text-sm text-muted-foreground">The latest changes to your member record.</p></div>
                        <div className="divide-y divide-border">{activity.map((item) => <div key={item.title} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{item.title}</p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">{item.detail}</p></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/[0.07] px-2.5 py-1 text-xs font-semibold text-primary"><span className="size-1.5 rounded-full bg-primary/70" aria-hidden="true" />{item.status}</span></div>)}</div>
                    </section>
                </div>
            </AppLayout>
        </>
    );
}

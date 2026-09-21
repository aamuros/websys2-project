import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    CircleCheck,
    Clock3,
    Sprout,
} from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

const schedule = [
    { day: '19', month: 'SEP', title: 'Community workday', detail: 'Saturday · 8:00 AM–10:30 AM · Tool shed', label: 'Registered' },
    { day: '24', month: 'SEP', title: 'Plot check-in', detail: 'Thursday · 4:30 PM · Plot A-14', label: 'Upcoming' },
    { day: '03', month: 'OCT', title: 'Seed sharing morning', detail: 'Saturday · 9:00 AM–11:00 AM · Pavilion', label: 'Optional' },
];

const updates = [
    { title: 'Watering hours were updated', detail: 'Morning access now begins at 6:00 AM.', time: '2 hours ago' },
    { title: 'Fresh compost is available', detail: 'Use the marked bays beside the tool shed.', time: 'Yesterday' },
];

const activity = [
    { title: 'Community workday registration', detail: 'Saturday, September 19', status: 'Confirmed', icon: CalendarDays },
    { title: 'Plot renewal request', detail: 'Submitted September 12', status: 'In review', icon: CircleCheck },
    { title: 'Garden orientation', detail: 'Completed September 5', status: 'Complete', icon: Check },
];

export default function MemberDashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there';

    return (
        <>
            <Head title="Member dashboard" />
            <AppLayout
                title={`Good evening, ${firstName}.`}
                description="Here’s what’s happening with your plot and the community this week."
            >
                <div className="pb-9">
                    <section aria-labelledby="garden-overview-title">
                        <div className="mb-5 flex h-7 items-center justify-between">
                            <h2 id="garden-overview-title" className="text-xl font-[750] leading-7 tracking-[-0.015em] text-foreground">Your garden</h2>
                        </div>

                        <div className="grid gap-6 lg:h-[282px] lg:grid-cols-[330px_minmax(0,1fr)]">
                            <article className="relative flex min-h-[282px] flex-col overflow-hidden rounded-3xl border border-white/45 bg-[#e9ebdf]">
                                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                                    <span className="absolute left-[18px] top-[18px] inline-flex h-7 items-center gap-1.5 rounded-full border border-primary/[0.08] bg-white/60 px-[11px] text-xs font-bold text-primary">
                                        <CircleCheck className="size-3.5" aria-hidden="true" />
                                        Active assignment
                                    </span>
                                    <span className="grid size-[138px] place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(64,79,29,0.14)]">
                                        <Sprout className="size-12 stroke-[1.7]" aria-hidden="true" />
                                    </span>
                                </div>

                                <div className="flex h-[88px] items-end gap-2.5 p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xl font-[760] leading-7 tracking-[-0.01em] text-foreground">Plot A-14</p>
                                        <p className="mt-0.5 truncate text-[13px] leading-5 text-muted-foreground">North garden · Raised bed</p>
                                    </div>
                                    <Link href="/garden-calendar" aria-label="Open plot calendar" className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/[0.12] bg-white/60 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                        <CalendarDays className="size-[18px]" aria-hidden="true" />
                                    </Link>
                                    <Link href="/assignments" className="inline-flex h-10 items-center justify-center rounded-full border border-primary/[0.12] bg-white/60 px-[13px] text-sm font-semibold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">View</Link>
                                </div>
                            </article>

                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-[0_8px_28px_rgba(64,79,29,0.055)]">
                                <div className="flex h-full min-h-[282px] flex-col px-6 py-[30px] sm:px-8">
                                    <div className="flex h-[26px] flex-wrap items-center gap-2.5">
                                        <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-primary/[0.08] px-[11px] text-xs font-bold text-primary">
                                            <CircleCheck className="size-3.5" aria-hidden="true" />
                                            In good standing
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">2026 growing season</span>
                                    </div>
                                    <h3 className="mt-[23px] max-w-[520px] text-[30px] font-[760] leading-9 tracking-[-0.026em] text-foreground">Your plot is ready for the week.</h3>
                                    <p className="mt-2.5 max-w-[530px] text-sm leading-[22px] text-muted-foreground">Plot A-14 is in good standing. Your next scheduled garden activity is the community workday this Saturday.</p>
                                    <div className="mt-auto flex flex-col gap-2 pt-[22px] sm:flex-row">
                                        <Link href="/assignments" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-[15px] text-sm font-semibold text-primary-foreground shadow-[0_2px_6px_rgba(64,79,29,0.16)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#354318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                            View plot details<ArrowRight className="size-4" aria-hidden="true" />
                                        </Link>
                                        <Link href="/garden-calendar" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-[15px] text-sm font-semibold text-primary transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                            <CalendarDays className="size-4" aria-hidden="true" />Open calendar
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section className="mt-[34px]" aria-labelledby="week-title">
                        <div className="mb-5 flex h-7 items-center justify-between">
                            <h2 id="week-title" className="text-xl font-[750] leading-7 tracking-[-0.015em] text-foreground">This week</h2>
                        </div>

                        <div className="grid gap-6 lg:h-[300px] lg:grid-cols-2">
                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white p-[22px] shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                                <div className="flex h-7 items-center justify-between">
                                    <h3 className="text-base font-[750] leading-6 tracking-[0.003em] text-foreground">Upcoming schedule</h3>
                                    <Link href="/garden-calendar" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">View all</Link>
                                </div>
                                <div className="mt-3">
                                    {schedule.map((item) => (
                                        <Link key={`${item.month}-${item.day}`} href="/garden-calendar" className="group grid min-h-[73px] grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-primary/[0.08] first:border-t-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
                                            <span className="flex h-[50px] w-[52px] flex-col items-center justify-center rounded-[13px] bg-[#f3f1ea]" aria-hidden="true">
                                                <span className="text-[10px] font-extrabold tracking-[0.08em] text-muted-foreground">{item.month}</span>
                                                <span className="text-lg font-[760] leading-5 text-foreground">{item.day}</span>
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-bold text-foreground">{item.title}</span>
                                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.detail}</span>
                                            </span>
                                            <span className="rounded-full bg-primary/[0.08] px-2 py-1 text-[11px] font-bold text-primary">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </article>

                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white p-[22px] shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                                <div className="flex h-7 items-center justify-between">
                                    <h3 className="text-base font-[750] leading-6 tracking-[0.003em] text-foreground">Garden updates</h3>
                                    <Link href="/community-updates" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">See all</Link>
                                </div>
                                <div className="mt-3">
                                    {updates.map((item) => (
                                        <article key={item.title} className="border-t border-primary/[0.08] py-4 first:border-t-0">
                                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                                            <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{item.detail}</p>
                                            <p className="mt-[7px] flex items-center gap-1.5 text-[11px] text-muted-foreground/75"><Clock3 className="size-3" aria-hidden="true" />{item.time}</p>
                                        </article>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </section>

                    <section className="mt-[34px]" aria-labelledby="activity-title">
                        <div className="mb-5 flex h-7 items-center justify-between">
                            <h2 id="activity-title" className="text-xl font-[750] leading-7 tracking-[-0.015em] text-foreground">Recent activity</h2>
                        </div>
                        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white px-[22px] py-1 shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                            {activity.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-primary/[0.08] py-3.5 first:border-t-0">
                                        <div className="flex min-w-0 items-center gap-3.5">
                                            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold leading-5 text-foreground">{item.title}</p>
                                                <p className="mt-0.5 text-xs leading-[18px] text-muted-foreground">{item.detail}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex min-w-[76px] items-center justify-center rounded-full bg-primary/[0.08] px-2.5 py-1.5 text-[11px] font-bold text-primary">{item.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </AppLayout>
        </>
    );
}

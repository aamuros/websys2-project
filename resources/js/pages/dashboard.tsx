import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, CalendarDays, Check, Share2, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user!;
    const firstName = user.name.split(' ')[0];

    return (
        <AppLayout
            title={`Good day, ${firstName}`}
            description="Your community garden workspace is ready for you."
            actions={
                <Button asChild className="h-10 w-[255px] max-w-full justify-between rounded-full px-4 shadow-none">
                    <Link href={`/${user.role}/dashboard`}><ArrowUpRight className="size-4" /><span className="capitalize">Open {user.role} workspace</span></Link>
                </Button>
            }
        >
            <Head title="Dashboard" />

            <section aria-labelledby="your-garden-title">
                <h2 id="your-garden-title" className="text-xl font-semibold tracking-[-0.025em]">Your garden</h2>
                <div className="mt-6 h-[356px] w-full max-w-[280px] overflow-hidden rounded-3xl border bg-secondary">
                    <div className="grid h-[276px] place-items-center bg-primary/[0.06] p-8">
                        <div className="grid size-[164px] place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 hover:scale-[1.025]">
                            <Sprout className="size-20 stroke-[1.2]" />
                        </div>
                    </div>
                    <div className="flex h-[78px] items-center justify-between gap-3 border-t border-border/40 px-4">
                        <div className="min-w-0">
                            <p className="truncate text-xl font-semibold tracking-tight">{firstName}&rsquo;s garden</p>
                            <p className="text-sm capitalize text-muted-foreground">{user.role} access</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" className="grid size-10 place-items-center rounded-full border bg-background/60 transition-colors hover:bg-background" aria-label="Share garden"><Share2 className="size-[18px]" /></button>
                            <Button asChild variant="outline" className="h-10 rounded-full bg-background/60 px-3 shadow-none"><Link href={`/${user.role}/dashboard`}>Open</Link></Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8" aria-labelledby="overview-title">
                <h2 id="overview-title" className="text-xl font-semibold tracking-[-0.025em]">Workspace overview</h2>
                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    <article className="relative h-[340px] overflow-hidden rounded-3xl border bg-card p-5">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="font-semibold">Workspace readiness</h3>
                            <span className="text-sm text-muted-foreground">Today</span>
                        </div>
                        <div className="mt-4 flex h-[210px] flex-col justify-center gap-4">
                            <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Sprout className="size-5" />
                            </div>
                            <p className="max-w-md text-2xl font-semibold leading-7 tracking-[-0.025em]">
                                100% of your core garden systems are ready.
                            </p>
                        </div>
                        <button type="button" className="absolute bottom-5 left-5 inline-flex h-8 items-center gap-2 rounded-full border border-primary/35 px-3 text-sm font-medium transition-colors hover:bg-primary/10">
                            <span className="grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-2.5 stroke-[3]" />
                            </span>
                            What&rsquo;s ready to use?
                        </button>
                    </article>

                    <article className="h-[340px] overflow-hidden rounded-3xl border bg-card p-5">
                        <div className="relative h-[178px] overflow-hidden rounded-2xl border border-border/40 bg-secondary">
                            <div className="absolute inset-x-[21%] top-4 h-64 rounded-t-2xl border bg-background shadow-[0_8px_26px_rgba(64,79,29,0.08)]">
                                <div className="flex h-12 items-center gap-2 border-b border-border/40 px-4">
                                    <span className="size-2 rounded-full bg-primary/35" />
                                    <span className="size-2 rounded-full bg-primary/20" />
                                    <span className="size-2 rounded-full bg-primary/10" />
                                </div>
                                <div className="space-y-3 p-4">
                                    <div className="h-3 w-2/3 rounded-full bg-primary/20" />
                                    <div className="h-3 w-full rounded-full bg-primary/10" />
                                    <div className="h-3 w-4/5 rounded-full bg-primary/10" />
                                    <div className="mt-5 flex items-end gap-2">
                                        {[32, 50, 38, 68, 56, 82].map((height, index) => (
                                            <span key={index} className="flex-1 rounded-t bg-primary/25" style={{ height }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-3 text-center">
                            <h3 className="text-xl font-semibold tracking-[-0.025em]">Track your garden activity</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">Keep requests, plots, and schedules in one place.</p>
                            <div className="mt-4 flex justify-center gap-2 overflow-hidden">
                                {['Plots', 'Requests', 'Schedule'].map((label) => (
                                    <span key={label} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-primary/35 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10">
                                        <CalendarDays className="size-3.5" />{label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </AppLayout>
    );
}

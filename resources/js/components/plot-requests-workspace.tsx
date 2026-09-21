import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    Check,
    CheckCircle2,
    CircleDot,
    ClipboardCheck,
    Clock3,
    MapPin,
    Ruler,
    Sprout,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PlotRequest {
    id: number;
    status: RequestStatus;
    notes: string | null;
    submitted_at: string;
    updated_at: string;
    plot: {
        plot_code: string;
        location: string;
        size: number;
        status: string;
    } | null;
}

const statusDetails: Record<RequestStatus, {
    label: string;
    summary: string;
    tone: string;
    icon: LucideIcon;
}> = {
    pending: {
        label: 'Under review',
        summary: 'Garden staff are reviewing your request. We’ll update this page when a decision is made.',
        tone: 'bg-amber-100 text-amber-900',
        icon: Clock3,
    },
    approved: {
        label: 'Approved',
        summary: 'Your request has been approved. Check My assignments for the next steps and access details.',
        tone: 'bg-emerald-100 text-emerald-900',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Not approved',
        summary: 'This request was not approved. You can browse the directory and request another available plot.',
        tone: 'bg-red-100 text-red-900',
        icon: XCircle,
    },
    cancelled: {
        label: 'Cancelled',
        summary: 'This request is closed. You can submit a new request for any available plot.',
        tone: 'bg-stone-200 text-stone-700',
        icon: XCircle,
    },
};

function formatDate(value: string, includeTime = false) {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(new Date(value));
}

function RequestBadge({ status }: { status: RequestStatus }) {
    const details = statusDetails[status];
    const Icon = details.icon;

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', details.tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {details.label}
        </span>
    );
}

function RequestProgress({ request }: { request: PlotRequest }) {
    const isPending = request.status === 'pending';
    const finalLabel = request.status === 'approved'
        ? 'Request approved'
        : request.status === 'rejected'
            ? 'Decision recorded'
            : request.status === 'cancelled'
                ? 'Request closed'
                : 'Decision';
    const steps = [
        { label: 'Request submitted', detail: formatDate(request.submitted_at), complete: true, active: false },
        { label: 'Staff review', detail: isPending ? 'In progress' : 'Completed', complete: !isPending, active: isPending },
        { label: finalLabel, detail: isPending ? 'Waiting for review' : formatDate(request.updated_at), complete: !isPending, active: false },
    ];

    return (
        <ol className="grid gap-0 sm:grid-cols-3" aria-label="Request progress">
            {steps.map((step, index) => (
                <li key={step.label} className="relative flex gap-3 pb-7 last:pb-0 sm:block sm:pb-0 sm:pr-5">
                    {index < steps.length - 1 && (
                        <span className={cn(
                            'absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px sm:left-8 sm:right-0 sm:top-[15px] sm:h-px sm:w-auto',
                            steps[index + 1].complete ? 'bg-primary' : 'bg-border',
                        )} aria-hidden="true" />
                    )}
                    <span className={cn(
                        'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 sm:mb-3',
                        step.complete && 'border-primary bg-primary text-primary-foreground',
                        step.active && 'border-primary bg-background text-primary ring-4 ring-primary/10',
                        !step.complete && !step.active && 'border-border bg-background text-muted-foreground',
                    )}>
                        {step.complete ? <Check className="size-4" aria-hidden="true" /> : <CircleDot className="size-3.5" aria-hidden="true" />}
                    </span>
                    <span className="block pt-1 sm:pt-0">
                        <span className="block text-sm font-bold text-foreground">{step.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{step.detail}</span>
                    </span>
                </li>
            ))}
        </ol>
    );
}

function EmptyRequests() {
    return (
        <section className="grid min-h-[430px] place-items-center border-y border-border px-5 py-16 text-center" aria-labelledby="empty-requests-title">
            <div className="max-w-md">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/[0.08] text-primary">
                    <Sprout className="size-6" aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Start growing</p>
                <h2 id="empty-requests-title" className="mt-1 text-2xl font-[750] tracking-[-0.025em] text-foreground">No plot requests yet</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Browse available garden plots, choose a space that fits your plans, and tell the garden team what you’d like to grow.
                </p>
                <Button asChild className="mt-6 rounded-xl">
                    <Link href="/garden-plots">Browse available plots<ArrowRight aria-hidden="true" /></Link>
                </Button>
            </div>
        </section>
    );
}

function RequestHistory({ requests, currentId }: { requests: PlotRequest[]; currentId: number }) {
    return (
        <section aria-labelledby="request-history-title">
            <div className="border-b border-border pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">All activity</p>
                <h2 id="request-history-title" className="mt-1 text-xl font-[750] tracking-[-0.025em] text-foreground">Request history</h2>
            </div>
            <ul className="divide-y divide-border border-b border-border">
                {requests.map((request) => (
                    <li key={request.id} className="grid gap-4 px-1 py-5 transition-colors hover:bg-primary/[0.025] sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-center sm:px-2">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-foreground">{request.plot ? `Plot ${request.plot.plot_code}` : 'Former garden plot'}</p>
                                {request.id === currentId && <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current</span>}
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="size-3.5" aria-hidden="true" />
                                {request.plot?.location ?? 'Plot no longer listed'}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Submitted {formatDate(request.submitted_at)}</p>
                        <div className="sm:justify-self-end"><RequestBadge status={request.status} /></div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function PlotRequestsWorkspace({
    title,
    description,
    requests,
}: {
    title: string;
    description: string;
    requests: PlotRequest[];
}) {
    const currentRequest = requests.find((request) => request.status === 'pending') ?? requests[0];

    return (
        <AppLayout
            title={title}
            description={description}
            actions={(
                <Button asChild className="w-full rounded-xl sm:w-auto">
                    <Link href="/garden-plots"><Sprout aria-hidden="true" />Browse plots</Link>
                </Button>
            )}
        >
            <div className="space-y-9 pb-12 sm:space-y-12">
                {!currentRequest ? <EmptyRequests /> : (
                    <>
                        <section className="overflow-hidden rounded-[22px] bg-primary text-primary-foreground shadow-[0_12px_36px_rgba(64,79,29,0.14)]" aria-labelledby="current-request-title">
                            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                                <div className="p-6 sm:p-8">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">Current request</p>
                                        <RequestBadge status={currentRequest.status} />
                                    </div>
                                    <h2 id="current-request-title" className="mt-5 text-3xl font-[760] tracking-[-0.035em] sm:text-4xl">
                                        {currentRequest.plot ? `Plot ${currentRequest.plot.plot_code}` : 'Former garden plot'}
                                    </h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70">
                                        {statusDetails[currentRequest.status].summary}
                                    </p>
                                </div>
                                <dl className="grid grid-cols-2 border-t border-white/10 bg-black/[0.06] lg:border-l lg:border-t-0">
                                    <div className="flex min-h-28 flex-col justify-center border-r border-white/10 px-5 py-5">
                                        <MapPin className="size-4 text-primary-foreground/55" aria-hidden="true" />
                                        <dt className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/55">Location</dt>
                                        <dd className="mt-1 text-sm font-semibold">{currentRequest.plot?.location ?? 'Unavailable'}</dd>
                                    </div>
                                    <div className="flex min-h-28 flex-col justify-center px-5 py-5">
                                        <Ruler className="size-4 text-primary-foreground/55" aria-hidden="true" />
                                        <dt className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/55">Plot size</dt>
                                        <dd className="mt-1 text-sm font-semibold">{currentRequest.plot ? `${currentRequest.plot.size.toFixed(2)} m²` : 'Unavailable'}</dd>
                                    </div>
                                    <div className="col-span-2 border-t border-white/10 px-5 py-4">
                                        <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/55"><CalendarClock className="size-3.5" aria-hidden="true" />Submitted</dt>
                                        <dd className="mt-1.5 text-sm font-semibold">{formatDate(currentRequest.submitted_at, true)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </section>

                        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)] lg:gap-14">
                            <div className="space-y-9">
                                <section aria-labelledby="review-progress-title">
                                    <div className="border-b border-border pb-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Application progress</p>
                                        <h2 id="review-progress-title" className="mt-1 text-xl font-[750] tracking-[-0.025em] text-foreground">Review timeline</h2>
                                    </div>
                                    <div className="py-6"><RequestProgress request={currentRequest} /></div>
                                </section>

                                <section className="border-y border-border py-6" aria-labelledby="request-note-title">
                                    <div className="flex gap-4">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary"><ClipboardCheck className="size-4" aria-hidden="true" /></span>
                                        <div>
                                            <h2 id="request-note-title" className="font-bold text-foreground">Your growing plan</h2>
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                                {currentRequest.notes || 'No growing notes were included with this request.'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="border-l-2 border-primary/20 pl-5" aria-labelledby="what-happens-next-title">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Good to know</p>
                                <h2 id="what-happens-next-title" className="mt-1 text-lg font-[750] tracking-[-0.02em] text-foreground">What happens next</h2>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                    Staff review plot availability and your growing plan. A decision will appear here once the review is complete.
                                </p>
                                <Link href="/help" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-[gap] hover:gap-2.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                                    Read request guidance<ArrowRight className="size-4" aria-hidden="true" />
                                </Link>
                            </aside>
                        </div>

                        <RequestHistory requests={requests} currentId={currentRequest.id} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}

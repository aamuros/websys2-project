import { Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    Check,
    CircleDot,
    ClipboardCheck,
    Eye,
    LoaderCircle,
    MapPin,
    Ruler,
    Search,
    Sprout,
} from 'lucide-react';
import { useState } from 'react';
import { RequestBadge, requestStatusDetails as statusDetails, type RequestStatus } from '@/components/plot-request-status';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkspaceSearch } from '@/components/workspace-search';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export interface PlotRequest {
    id: number;
    status: RequestStatus;
    notes: string | null;
    decision_notes: string | null;
    reviewed_at: string | null;
    submitted_at: string;
    updated_at: string;
    plot: {
        plot_code: string;
        location: string;
        size: number;
        status: string;
    } | null;
}

function formatDate(value: string, includeTime = false) {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    }).format(new Date(value));
}

function RequestProgress({ request }: { request: PlotRequest }) {
    const isPending = request.status === 'pending';
    const isCancelled = request.status === 'cancelled';
    const steps = isCancelled ? [
        { label: 'Request submitted', detail: formatDate(request.submitted_at), complete: true, active: false },
        { label: 'Request cancelled', detail: formatDate(request.updated_at), complete: true, active: false },
    ] : [
        { label: 'Request submitted', detail: formatDate(request.submitted_at), complete: true, active: false },
        { label: 'Staff review', detail: isPending ? 'In progress' : 'Completed', complete: !isPending, active: isPending },
        { label: isPending ? 'Decision' : statusDetails[request.status].label, detail: isPending ? 'Waiting for review' : formatDate(request.reviewed_at ?? request.updated_at), complete: !isPending, active: false },
    ];

    return (
        <ol className={cn('grid gap-0', isCancelled ? 'sm:grid-cols-2' : 'sm:grid-cols-3')} aria-label="Request progress">
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
                <h2 id="empty-requests-title" className="mt-5 text-xl font-[750] tracking-[-0.025em] text-foreground">No plot requests yet</h2>
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

const filterOptions: Array<{ value: 'all' | RequestStatus; label: string }> = [
    { value: 'all', label: 'All requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
];

function plotName(request: PlotRequest) {
    return request.plot ? `Plot ${request.plot.plot_code}` : 'Former garden plot';
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
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | RequestStatus>('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const cancelForm = useForm({});
    const selectedRequest = requests.find((request) => request.id === selectedId);
    const currentRequest = requests.find((request) => request.status === 'pending') ?? requests[0];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredRequests = requests.filter((request) => (
        (status === 'all' || request.status === status)
        && (!normalizedQuery || [request.plot?.plot_code, request.plot?.location, request.notes, request.decision_notes]
            .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)))
    ));

    function closeDetails() {
        if (cancelForm.processing) return;
        setSelectedId(null);
        setConfirmCancel(false);
        cancelForm.clearErrors();
    }

    function cancelRequest() {
        if (!selectedRequest || selectedRequest.status !== 'pending' || cancelForm.processing) return;
        cancelForm.post(`/plot-requests/${selectedRequest.id}/cancel`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedId(null);
                setConfirmCancel(false);
            },
        });
    }

    return (
        <AppLayout
            title={title}
            description={description}
            actions={(
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <WorkspaceSearch value={query} onChange={setQuery} label="Search requests by plot, location, or notes" placeholder="Search your requests" className="sm:w-[233px]" />
                    <Button asChild className="rounded-xl">
                        <Link href="/garden-plots"><Sprout aria-hidden="true" />Request a plot</Link>
                    </Button>
                </div>
            )}
        >
            <div className="space-y-9 pb-12 sm:space-y-12">
                {currentRequest && (
                    <>
                        <section className="overflow-hidden rounded-[22px] bg-primary text-primary-foreground shadow-[0_12px_36px_rgba(64,79,29,0.14)]" aria-labelledby="current-request-title">
                            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                                <div className="p-6 sm:p-8">
                                    <RequestBadge status={currentRequest.status} />
                                    <h2 id="current-request-title" className="mt-5 text-3xl font-[760] tracking-[-0.035em] sm:text-4xl">{plotName(currentRequest)}</h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70">{statusDetails[currentRequest.status].summary}</p>
                                    <Button variant="outline" size="sm" className="mt-5 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => { setSelectedId(currentRequest.id); setConfirmCancel(false); cancelForm.clearErrors(); }}>View details<Eye aria-hidden="true" /></Button>
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
                                    <h2 id="review-progress-title" className="sr-only">Review timeline</h2>
                                    <div className="py-6"><RequestProgress request={currentRequest} /></div>
                                </section>
                                <section className="border-y border-border py-6" aria-labelledby="current-request-note-title">
                                    <div className="flex gap-4">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary"><ClipboardCheck className="size-4" aria-hidden="true" /></span>
                                        <div>
                                            <h2 id="current-request-note-title" className="font-bold text-foreground">Your growing plan</h2>
                                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{currentRequest.notes || 'No growing notes were included with this request.'}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <aside className="border-l-2 border-primary/20 pl-5" aria-labelledby="what-happens-next-title">
                                <h2 id="what-happens-next-title" className="sr-only">What happens next</h2>
                                <p className="text-sm leading-6 text-muted-foreground">Staff review plot availability and your growing plan. A decision will appear here once the review is complete.</p>
                                <Link href="/help" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-[gap] hover:gap-2.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Read request guidance<ArrowRight className="size-4" aria-hidden="true" /></Link>
                            </aside>
                        </div>
                    </>
                )}

                <section aria-labelledby="request-history-title">
                    <h2 id="request-history-title" className="sr-only">Request history</h2>
                    <div className="mb-[18px] flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
                        <div className="flex min-h-10 flex-wrap items-center gap-1" role="group" aria-label="Filter requests by status">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={status === option.value}
                                    onClick={() => setStatus(option.value)}
                                    className={cn(
                                        'h-9 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                                        status === option.value && 'bg-primary/[0.09] font-semibold text-foreground',
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="sr-only" aria-live="polite">{filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} shown</p>
                    {requests.length === 0 ? <EmptyRequests /> : filteredRequests.length === 0 ? (
                        <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-border bg-card/55 px-4 text-center">
                            <div>
                                <Search className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
                                <h3 className="mt-3 font-bold">No matching requests</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Try another plot, location, or status.</p>
                                <button type="button" onClick={() => { setQuery(''); setStatus('all'); }} className="mt-3 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Clear filters</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <ul className="divide-y divide-border border-y border-border">
                                {filteredRequests.map((request) => (
                                    <li key={request.id} className="grid gap-4 px-1 py-5 transition-colors hover:bg-primary/[0.025] sm:grid-cols-[minmax(0,1fr)_150px_auto_auto] sm:items-center sm:px-2">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-foreground">{plotName(request)}</p>
                                                {request.id === currentRequest?.id && <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current</span>}
                                            </div>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" />{request.plot?.location ?? 'Plot no longer listed'}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Submitted {formatDate(request.submitted_at)}</p>
                                        <div className="sm:justify-self-end"><RequestBadge status={request.status} /></div>
                                        <Button variant="outline" size="sm" className="justify-self-start rounded-xl sm:justify-self-end" aria-label={`View request #${request.id} for ${plotName(request)}`} onClick={() => { setSelectedId(request.id); setConfirmCancel(false); cancelForm.clearErrors(); }}>View<Eye aria-hidden="true" /></Button>
                                    </li>
                                ))}
                            </ul>
                            <p className="py-3 text-xs text-muted-foreground">Showing {filteredRequests.length} of {requests.length} {requests.length === 1 ? 'request' : 'requests'}</p>
                        </div>
                    )}
                </section>

                <p className="text-sm text-muted-foreground">Need help with a request? <Link href="/help" className="rounded-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Read request guidance</Link></p>
            </div>

            <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => { if (!open) closeDetails(); }}>
                {selectedRequest && (
                    <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card" showCloseButton={!cancelForm.processing}>
                        <DialogHeader className="pr-6">
                            <DialogTitle className="text-xl font-[750] tracking-[-0.025em]">{confirmCancel ? 'Cancel this request?' : plotName(selectedRequest)}</DialogTitle>
                            <DialogDescription>
                                {confirmCancel ? 'This closes your pending request. You can request an available plot again later.' : `Request #${selectedRequest.id} · Submitted ${formatDate(selectedRequest.submitted_at, true)}`}
                            </DialogDescription>
                        </DialogHeader>

                        {!confirmCancel && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/[0.055] p-4">
                                    <div>
                                        <p className="text-sm font-semibold">{selectedRequest.plot?.location ?? 'Plot no longer listed'}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{selectedRequest.plot ? `${selectedRequest.plot.size.toFixed(2)} m²` : 'Plot details unavailable'}</p>
                                    </div>
                                    <RequestBadge status={selectedRequest.status} />
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground">{statusDetails[selectedRequest.status].summary}</p>
                                <section className="border-y border-border py-5" aria-label="Review timeline"><RequestProgress request={selectedRequest} /></section>
                                <section aria-labelledby="request-note-title">
                                    <h3 id="request-note-title" className="flex items-center gap-2 text-sm font-bold"><ClipboardCheck className="size-4" aria-hidden="true" />Your growing plan</h3>
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{selectedRequest.notes || 'No growing notes were included with this request.'}</p>
                                </section>
                                {selectedRequest.decision_notes && (
                                    <section className="border-t border-border pt-4" aria-labelledby="decision-note-title">
                                        <h3 id="decision-note-title" className="text-sm font-bold">Staff decision note</h3>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{selectedRequest.decision_notes}</p>
                                    </section>
                                )}
                            </>
                        )}

                        {Object.values(cancelForm.errors).filter((error): error is string => typeof error === 'string').map((error, index) => <p key={index} role="alert" className="text-sm text-destructive">{error}</p>)}
                        <DialogFooter className="mt-2 border-t border-border pt-4">
                            {confirmCancel ? (
                                <>
                                    <Button variant="outline" className="rounded-xl" disabled={cancelForm.processing} onClick={() => setConfirmCancel(false)}>Keep request</Button>
                                    <Button variant="destructive" className="rounded-xl" disabled={cancelForm.processing} onClick={cancelRequest}>
                                        {cancelForm.processing && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                                        {cancelForm.processing ? 'Cancelling…' : 'Cancel request'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" className="rounded-xl" onClick={closeDetails}>Close</Button>
                                    {selectedRequest.status === 'pending' && <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setConfirmCancel(true)}>Cancel request</Button>}
                                    {selectedRequest.status === 'approved' && <Button asChild className="rounded-xl"><Link href="/assignments">View my assignments<ArrowRight aria-hidden="true" /></Link></Button>}
                                    {(selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled') && <Button asChild className="rounded-xl"><Link href="/garden-plots">Browse available plots<ArrowRight aria-hidden="true" /></Link></Button>}
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </AppLayout>
    );
}

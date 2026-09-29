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
import { PlotMarker, WorkspacePanel, WorkspaceStatusTabs } from '@/components/workspace-ui';
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
        <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border bg-card/55 px-5 py-12 text-center" aria-labelledby="empty-requests-title">
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
            <div className="space-y-6 pb-9">
                {currentRequest && (
                    <WorkspacePanel className="bg-[#fbf8f2] shadow-none">
                        <section aria-labelledby="current-request-title">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/80 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <PlotMarker code={currentRequest.plot?.plot_code ?? '—'} />
                                    <div>
                                        <h2 id="current-request-title" className="text-lg font-[750] tracking-[-0.02em]">{plotName(currentRequest)}</h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground">Request #{currentRequest.id} · Current request</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <RequestBadge status={currentRequest.status} />
                                    <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => { setSelectedId(currentRequest.id); setConfirmCancel(false); cancelForm.clearErrors(); }}>View details<Eye aria-hidden="true" /></Button>
                                </div>
                            </div>
                            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                                <p className="max-w-sm text-sm leading-6 text-muted-foreground">{statusDetails[currentRequest.status].summary}</p>
                                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" />Location</dt><dd className="mt-1.5 text-sm font-semibold">{currentRequest.plot?.location ?? 'Unavailable'}</dd></div>
                                    <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ruler className="size-3.5" aria-hidden="true" />Plot size</dt><dd className="mt-1.5 text-sm font-semibold">{currentRequest.plot ? `${currentRequest.plot.size.toFixed(2)} m²` : 'Unavailable'}</dd></div>
                                    <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true" />Submitted</dt><dd className="mt-1.5 text-sm font-semibold">{formatDate(currentRequest.submitted_at)}</dd></div>
                                </dl>
                            </div>
                            <section className="border-t border-border/70 px-5 py-5 sm:px-6" aria-label="Review timeline"><RequestProgress request={currentRequest} /></section>
                        </section>
                    </WorkspacePanel>
                )}

                <section aria-labelledby="request-history-title">
                    <h2 id="request-history-title" className="sr-only">Request history</h2>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <WorkspaceStatusTabs value={status} options={filterOptions.map((option) => ({ ...option, count: option.value === 'all' ? requests.length : requests.filter((request) => request.status === option.value).length }))} onChange={setStatus} label="Filter requests by status" />
                        <p className="text-xs tabular-nums text-muted-foreground">{filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}</p>
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
                        <WorkspacePanel className="bg-[#fbf8f2] shadow-none">
                            <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_76px] gap-4 border-b border-border/70 bg-card/80 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.075em] text-muted-foreground sm:grid sm:px-6" aria-hidden="true"><span>Garden plot</span><span>Submitted</span><span>Status</span><span className="text-right">Details</span></div>
                            <ul className="divide-y divide-border/60">
                                {filteredRequests.map((request) => (
                                    <li key={request.id} className="grid gap-3 px-5 py-4 transition-colors hover:bg-primary/[0.032] sm:grid-cols-[minmax(0,1fr)_150px_120px_76px] sm:items-center sm:gap-4 sm:px-6">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <PlotMarker code={request.plot?.plot_code ?? '—'} />
                                            <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-foreground">{plotName(request)}</p>
                                                {request.id === currentRequest?.id && <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current</span>}
                                            </div>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" />{request.plot?.location ?? 'Plot no longer listed'}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground"><span className="sm:sr-only">Submitted </span>{formatDate(request.submitted_at)}</p>
                                        <div><RequestBadge status={request.status} /></div>
                                        <Button variant="outline" size="sm" className="justify-self-start rounded-xl sm:justify-self-end" aria-label={`View request #${request.id} for ${plotName(request)}`} onClick={() => { setSelectedId(request.id); setConfirmCancel(false); cancelForm.clearErrors(); }}>View<Eye aria-hidden="true" /></Button>
                                    </li>
                                ))}
                            </ul>
                        </WorkspacePanel>
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

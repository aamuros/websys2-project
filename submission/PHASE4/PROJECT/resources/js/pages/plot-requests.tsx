import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { RequestBadge, type RequestStatus } from '@/components/plot-request-status';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Field, FormDialog, Pagination, PlotMarker, Toolbar, WorkspacePanel, WorkspaceStatusTabs, fieldClass, textareaClass, type Paginated } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

type RequestItem = {
    id: number;
    status: RequestStatus;
    notes?: string | null;
    decision_notes?: string | null;
    created_at: string;
    user: { name: string };
    garden_plot?: { id: number; plot_code: string; location: string } | null;
};
type Plot = { id: number; plot_code: string; location: string };
const statusOptions = [
    { value: '', label: 'All requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function PlotRequests({ requests, availablePlots, filters }: {
    requests: Paginated<RequestItem>;
    availablePlots: Plot[];
    filters: { search?: string; status?: string };
}) {
    const member = usePage<SharedPageProps>().props.auth.user!.role === 'member';
    const [mode, setMode] = useState<'new' | 'approve' | 'reject' | null>(null);
    const [selected, setSelected] = useState<RequestItem | null>(null);
    const form = useForm({ garden_plot_id: '', notes: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', decision_notes: '' });

    function open(nextMode: 'new' | 'approve' | 'reject', item?: RequestItem) {
        setSelected(item ?? null);
        form.reset();
        form.clearErrors();
        setMode(nextMode);
    }

    function act() {
        const options = { preserveScroll: true, onSuccess: () => setMode(null) };
        if (mode === 'new') form.post('/plot-requests', options);
        else if (selected && mode) form.post('/plot-requests/' + selected.id + '/' + mode, options);
    }

    return <>
        <Head title={member ? 'My plot requests' : 'Plot requests'} />
        <AppLayout
            title={member ? 'My plot requests' : 'Plot requests'}
            description={member ? 'Submit and track requests for a garden plot.' : 'Review member requests and create assignments.'}
            actions={<Toolbar path="/plot-requests" search={filters.search} actionLabel={member ? 'New request' : undefined} onAction={() => open('new')} />}
        >
            <section aria-label="Plot request records" className="pb-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <WorkspaceStatusTabs value={filters.status ?? ''} options={statusOptions} onChange={(status) => router.get('/plot-requests', { ...filters, status }, { preserveState: true, preserveScroll: true, replace: true })} label="Filter requests by status" />
                    <p className="text-xs tabular-nums text-muted-foreground">{requests.total} {requests.total === 1 ? 'request' : 'requests'}</p>
                </div>
                {requests.data.length === 0 ? <Empty message="No plot requests match this view." /> : (
                    <WorkspacePanel className="bg-[#fbf8f2] shadow-none">
                        <Table className="[&_th]:h-10 [&_th]:text-[10px]">
                            <TableHeader className="bg-card/80">
                                <TableRow className="hover:bg-transparent">
                                    {!member && <TableHead className="px-5 sm:px-6">Member</TableHead>}
                                    <TableHead>Garden plot</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead>
                                    <TableHead className="hidden xl:table-cell">Growing plan</TableHead>
                                    <TableHead className="px-5 text-right sm:px-6">Review</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.map((item) => (
                                    <TableRow key={item.id} className="border-border/60 hover:bg-primary/[0.032]">
                                        {!member && <TableCell className="min-w-40 px-5 sm:px-6"><p className="font-semibold">{item.user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">Request #{item.id}</p></TableCell>}
                                        <TableCell className="min-w-48"><div className="flex items-center gap-3"><PlotMarker code={item.garden_plot?.plot_code ?? '—'} /><div><p className="font-semibold">{item.garden_plot ? 'Plot ' + item.garden_plot.plot_code : 'Any plot'}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.garden_plot?.location ?? 'No plot selected'}</p></div></div></TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                        <TableCell className="whitespace-nowrap"><RequestBadge status={item.status} /></TableCell>
                                        <TableCell className="hidden max-w-48 xl:table-cell"><p className="truncate text-xs text-muted-foreground" title={item.decision_notes ?? item.notes ?? undefined}>{item.decision_notes ?? item.notes ?? 'No notes provided'}</p></TableCell>
                                        <TableCell className="px-5 text-right sm:px-6">
                                            <div className="flex justify-end gap-2">
                                                {member && item.status === 'pending' && <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => router.post('/plot-requests/' + item.id + '/cancel')}>Cancel</Button>}
                                                {!member && item.status === 'pending' && <><Button size="sm" className="rounded-[10px]" onClick={() => open('approve', item)}>Approve</Button><Button size="sm" variant="outline" className="rounded-[10px]" onClick={() => open('reject', item)}>Reject</Button></>}
                                                {item.status !== 'pending' && <span className="text-xs text-muted-foreground">Closed</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination page={requests} />
                    </WorkspacePanel>
                )}
            </section>
        </AppLayout>
        <FormDialog
            open={mode !== null} onOpenChange={(value) => !value && setMode(null)}
            title={mode === 'new' ? 'Request a plot' : mode === 'approve' ? 'Approve request' : 'Reject request'}
            description={mode === 'new' ? 'Choose an available plot and share your growing plan.' : mode === 'approve' ? 'Approve this request and create an active assignment.' : 'Explain the decision to the member.'}
            submitLabel={mode === 'approve' ? 'Approve and assign' : mode === 'reject' ? 'Reject request' : 'Submit request'}
            processing={form.processing} onSubmit={act}
        >
            {selected && <div className="rounded-xl bg-primary/[0.045] p-4"><div className="flex items-center gap-3"><PlotMarker code={selected.garden_plot?.plot_code ?? '—'} /><div><p className="text-sm font-semibold">{selected.user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{selected.garden_plot ? 'Plot ' + selected.garden_plot.plot_code + ' · ' + selected.garden_plot.location : 'No plot selected'}</p></div></div>{selected.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{selected.notes}</p>}</div>}
            {mode === 'new' && <>
                <Field label="Available plot" error={form.errors.garden_plot_id}><select className={fieldClass} value={form.data.garden_plot_id} onChange={(event) => form.setData('garden_plot_id', event.target.value)}><option value="">Select a plot</option>{availablePlots.map((plot) => <option value={plot.id} key={plot.id}>{plot.plot_code} — {plot.location}</option>)}</select></Field>
                <Field label="Growing plan" error={form.errors.notes}><textarea className={textareaClass} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} /></Field>
            </>}
            {mode === 'approve' && <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date" error={form.errors.start_date}><input type="date" className={fieldClass} value={form.data.start_date} onChange={(event) => form.setData('start_date', event.target.value)} /></Field>
                <Field label="End date (optional)" error={form.errors.end_date}><input type="date" className={fieldClass} value={form.data.end_date} onChange={(event) => form.setData('end_date', event.target.value)} /></Field>
            </div>}
            {(mode === 'approve' || mode === 'reject') && <Field label={mode === 'reject' ? 'Reason' : 'Decision note (optional)'} error={form.errors.decision_notes}><textarea className={textareaClass} value={form.data.decision_notes} onChange={(event) => form.setData('decision_notes', event.target.value)} /></Field>}
        </FormDialog>
    </>;
}

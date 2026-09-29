import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, CircleCheck, Clock3, Eye, LoaderCircle, MapPin, Sprout, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CropTypeIcon, cropTypes, type CropType } from '@/components/crop-type-icon';
import { PlantingCalendar } from '@/components/planting-calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, type Paginated } from '@/components/workspace-ui';
import { WorkspaceSearch } from '@/components/workspace-search';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type AssignmentStatus = 'active' | 'ended' | 'cancelled';
export type AssignmentCrop = { id: number; name: string; type: CropType };
type Planting = { id: number; planted_at: string; crop: AssignmentCrop };
export type MemberAssignment = {
    id: number;
    status: AssignmentStatus;
    start_date: string;
    end_date: string | null;
    garden_plot: { plot_code: string; location: string; size: number | string };
    plantings?: Planting[];
};

const panelClass = 'overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]';
const eyebrowClass = 'text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground';
const statusOptions: Array<{ value: '' | AssignmentStatus; label: string }> = [
    { value: '', label: 'All assignments' },
    { value: 'active', label: 'Active' },
    { value: 'ended', label: 'Ended' },
    { value: 'cancelled', label: 'Cancelled' },
];

function dateLabel(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AssignmentBadge({ status }: { status: AssignmentStatus }) {
    const Icon = status === 'active' ? CircleCheck : status === 'ended' ? Clock3 : XCircle;
    return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize', status === 'active' ? 'bg-primary/[0.09] text-primary' : 'bg-secondary text-muted-foreground')}><Icon className="size-3.5" aria-hidden="true" />{status}</span>;
}

function AssignmentFacts({ assignment }: { assignment: MemberAssignment }) {
    return (
        <dl className="grid gap-5 sm:grid-cols-3">
            <div><dt className={eyebrowClass}>Location</dt><dd className="mt-2 flex items-start gap-1.5 text-sm font-semibold"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{assignment.garden_plot.location}</dd></div>
            <div><dt className={eyebrowClass}>Plot size</dt><dd className="mt-2 text-sm font-semibold">{Number(assignment.garden_plot.size).toFixed(2)} m²</dd></div>
            <div><dt className={eyebrowClass}>Assignment period</dt><dd className="mt-2 text-sm font-semibold">{dateLabel(assignment.start_date)}<span className="mt-1 block text-xs font-normal text-muted-foreground">{assignment.end_date ? `Ends ${dateLabel(assignment.end_date)}` : 'No end date set'}</span></dd></div>
        </dl>
    );
}

function PlantingsTable({ plantings }: { plantings: Planting[] }) {
    if (plantings.length === 0) {
        return <div className="p-5"><p className="text-sm font-semibold">No plantings recorded</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Recorded crops and planting dates will appear here.</p></div>;
    }
    const sortedPlantings = [...plantings].sort((a, b) => b.planted_at.localeCompare(a.planted_at) || b.id - a.id);
    return (
        <Table>
            <caption className="sr-only">Recorded crops and planting dates</caption>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Crop</TableHead><TableHead>Type</TableHead><TableHead>Planted</TableHead></TableRow></TableHeader>
            <TableBody>{sortedPlantings.map((planting) => (
                <TableRow key={planting.id}>
                    <TableCell><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.055] [&_svg]:text-primary"><CropTypeIcon type={planting.crop.type} /></span><span className="font-bold">{planting.crop.name}</span></div></TableCell>
                    <TableCell className="capitalize text-muted-foreground">{planting.crop.type}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{dateLabel(planting.planted_at)}</TableCell>
                </TableRow>
            ))}</TableBody>
        </Table>
    );
}

export function MemberAssignmentsWorkspace({ assignments, activeAssignment, crops, filters, today }: {
    assignments: Paginated<MemberAssignment>;
    activeAssignment: MemberAssignment | null;
    crops: AssignmentCrop[];
    filters: { search?: string; status?: string };
    today: string;
}) {
    const pageUrl = usePage().url;
    const lastPlantingDate = activeAssignment?.end_date && activeAssignment.end_date.slice(0, 10) < today
        ? activeAssignment.end_date.slice(0, 10)
        : today;
    const canPlant = Boolean(activeAssignment && activeAssignment.start_date.slice(0, 10) <= lastPlantingDate && crops.length);
    const [plantingOpen, setPlantingOpen] = useState(() => {
        const requestedId = new URLSearchParams(pageUrl.split('?')[1] ?? '').get('plant');
        return canPlant && String(activeAssignment?.id) === requestedId;
    });
    const [query, setQuery] = useState(filters.search ?? '');
    const [cropFilter, setCropFilter] = useState<CropType | 'all'>('all');
    const [selectedAssignment, setSelectedAssignment] = useState<MemberAssignment | null>(null);
    const plantingForm = useForm({ crop_id: '', planted_at: lastPlantingDate });
    const visibleCrops = crops.filter((crop) => cropFilter === 'all' || crop.type === cropFilter);
    const hasFilters = Boolean(filters.search || filters.status);

    function filterHistory(status = filters.status ?? '', search = query.trim()) {
        router.get('/assignments', { ...(status && { status }), ...(search && { search }) }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function openPlanting() {
        plantingForm.setData({ crop_id: '', planted_at: lastPlantingDate });
        plantingForm.clearErrors();
        setCropFilter('all');
        setPlantingOpen(true);
    }

    function submitPlanting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!activeAssignment || !canPlant || plantingForm.processing) return;
        plantingForm.clearErrors();
        if (!plantingForm.data.crop_id) {
            plantingForm.setError('crop_id', 'Choose the crop you planted.');
            return;
        }
        plantingForm.post(`/assignments/${activeAssignment.id}/plantings`, { preserveScroll: true, onSuccess: () => setPlantingOpen(false) });
    }

    return (
        <AppLayout
            title="My assignments"
            description="View your current plot, record plantings, and review past assignments."
            actions={(
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="rounded-xl"><Link href="/garden-calendar"><CalendarDays aria-hidden="true" />Garden calendar</Link></Button>
                    {activeAssignment ? <Button className="rounded-xl" disabled={!canPlant} onClick={openPlanting}><Sprout aria-hidden="true" />Add planting</Button> : <Button asChild className="rounded-xl"><Link href="/garden-plots"><Sprout aria-hidden="true" />Browse plots</Link></Button>}
                </div>
            )}
        >
            <div className="space-y-8 pb-9">
                <section aria-labelledby="current-assignment-title">
                    <h2 id="current-assignment-title" className="sr-only">Current assignment</h2>
                    {activeAssignment ? (
                        <div className={panelClass}>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/[0.055] p-5">
                                <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Sprout className="size-5" aria-hidden="true" /></span><h3 className="text-lg font-bold tracking-[-0.02em]">Plot {activeAssignment.garden_plot.plot_code}</h3></div>
                                <AssignmentBadge status={activeAssignment.status} />
                            </div>
                            <div className="p-5"><AssignmentFacts assignment={activeAssignment} /></div>
                            {!canPlant && <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">{activeAssignment.start_date.slice(0, 10) > today ? `You can record plantings from ${dateLabel(activeAssignment.start_date)}.` : 'Garden staff have not added any crops yet. Planting records will be available once crops are added.'}</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-card/55 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div><h3 className="text-sm font-bold">No active plot assignment</h3><p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">Browse available plots to submit a request, or check a request you already sent.</p></div>
                            <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto"><Link href="/plot-requests">View my requests<ArrowRight aria-hidden="true" /></Link></Button>
                        </div>
                    )}
                </section>

                {activeAssignment && (
                    <section aria-labelledby="planting-record-title">
                        <h2 id="planting-record-title" className="sr-only">Planting record</h2>
                        <p className="mb-[18px] text-sm text-muted-foreground">{activeAssignment.plantings?.length ?? 0} plantings recorded</p>
                        <div className={panelClass}><PlantingsTable plantings={activeAssignment.plantings ?? []} /></div>
                    </section>
                )}

                <section aria-labelledby="assignment-history-title">
                    <h2 id="assignment-history-title" className="sr-only">Assignment history</h2>
                    <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                        <WorkspaceSearch value={query} onChange={setQuery} label="Search assignments by plot or location" placeholder="Search code or location" onSubmit={() => filterHistory()} onClear={() => filterHistory(filters.status ?? '', '')} className="sm:w-[233px]" />
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-1" role="group" aria-label="Filter assignments by status">
                        {statusOptions.map((option) => <button key={option.value} type="button" aria-pressed={(filters.status ?? '') === option.value} onClick={() => filterHistory(option.value)} className={cn('h-9 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', (filters.status ?? '') === option.value && 'bg-primary/[0.09] font-semibold text-foreground')}>{option.label}</button>)}
                    </div>
                    {assignments.data.length ? (
                        <div className={panelClass}>
                            <Table>
                                <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Garden plot</TableHead><TableHead>Started</TableHead><TableHead>End date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader>
                                <TableBody>{assignments.data.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="min-w-40"><p className="font-bold">Plot {assignment.garden_plot.plot_code}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{assignment.garden_plot.location}</p></TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">{dateLabel(assignment.start_date)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">{assignment.end_date ? dateLabel(assignment.end_date) : 'No end date set'}</TableCell>
                                        <TableCell className="whitespace-nowrap"><AssignmentBadge status={assignment.status} /></TableCell>
                                        <TableCell className="text-right"><Button size="sm" variant="outline" className="rounded-xl" aria-label={`View assignment #${assignment.id} for plot ${assignment.garden_plot.plot_code}`} onClick={() => setSelectedAssignment(assignment)}>View<Eye aria-hidden="true" /></Button></TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                            <Pagination page={assignments} />
                            {assignments.last_page <= 1 && <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{assignments.total} {assignments.total === 1 ? 'assignment' : 'assignments'}</p>}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-card/55 px-5 py-9 text-center">
                            <h3 className="text-sm font-bold">{hasFilters ? 'No matching assignments' : 'No assignment history yet'}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{hasFilters ? 'Try a different plot, location, or status.' : 'Your plot assignments will appear here once staff assign a plot.'}</p>
                            {hasFilters && <button type="button" onClick={() => { setQuery(''); filterHistory('', ''); }} className="mt-3 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Clear filters</button>}
                        </div>
                    )}
                </section>
                <p className="text-sm text-muted-foreground">Questions about your assignment dates? <Link href="/help" className="rounded-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Read assignment guidance</Link></p>
            </div>

            <Dialog open={Boolean(selectedAssignment)} onOpenChange={(open) => { if (!open) setSelectedAssignment(null); }}>
                {selectedAssignment && <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card"><DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] tracking-[-0.025em]">Plot {selectedAssignment.garden_plot.plot_code}</DialogTitle><DialogDescription>Assignment #{selectedAssignment.id} · Plot details and recorded plantings.</DialogDescription></DialogHeader><div><AssignmentBadge status={selectedAssignment.status} /></div><div className="border-y border-border py-5"><AssignmentFacts assignment={selectedAssignment} /></div><section aria-labelledby="past-plantings-title"><h3 id="past-plantings-title" className="mb-3 text-sm font-bold">Planting record</h3><div className="overflow-hidden rounded-xl border border-border"><PlantingsTable plantings={selectedAssignment.plantings ?? []} /></div></section><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setSelectedAssignment(null)}>Close</Button></DialogFooter></DialogContent>}
            </Dialog>

            <Dialog open={plantingOpen && Boolean(activeAssignment)} onOpenChange={(open) => { if (!plantingForm.processing) setPlantingOpen(open); }}>
                {activeAssignment && <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-2xl bg-card" showCloseButton={!plantingForm.processing}>
                    <DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] tracking-[-0.025em]">Add planting</DialogTitle><DialogDescription>Record a crop planted in plot {activeAssignment.garden_plot.plot_code}.</DialogDescription></DialogHeader>
                    <form onSubmit={submitPlanting} className="space-y-5">
                        <div role="group" aria-labelledby="planting-crop-label" aria-describedby={plantingForm.errors.crop_id ? 'planting-crop-error' : undefined}>
                            <h3 id="planting-crop-label" className="mb-2 text-sm font-semibold">Choose a crop</h3>
                            <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Filter crops by type">{(['all', ...cropTypes] as const).map((type) => <button key={type} type="button" aria-pressed={cropFilter === type} onClick={() => setCropFilter(type)} className={cn('h-8 rounded-full px-2.5 text-xs font-medium capitalize text-muted-foreground transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', cropFilter === type && 'bg-primary/[0.09] font-semibold text-primary')}>{type === 'all' ? 'All crops' : type}</button>)}</div>
                            <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4">
                                {visibleCrops.map((crop) => <button key={crop.id} type="button" aria-pressed={plantingForm.data.crop_id === String(crop.id)} onClick={() => { plantingForm.setData('crop_id', String(crop.id)); plantingForm.clearErrors('crop_id'); }} className={cn('flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border p-2 text-center transition-colors hover:border-primary/30 hover:bg-primary/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:text-primary', plantingForm.data.crop_id === String(crop.id) && 'border-primary bg-primary/[0.09] ring-1 ring-primary')}><CropTypeIcon type={crop.type} /><span className="text-xs font-semibold leading-4">{crop.name}</span></button>)}
                                {!visibleCrops.length && <p className="col-span-full py-4 text-sm text-muted-foreground">No crops available in this category.</p>}
                            </div>
                            {plantingForm.errors.crop_id && <p id="planting-crop-error" role="alert" className="mt-2 text-sm text-destructive">{plantingForm.errors.crop_id}</p>}
                        </div>
                        <section aria-labelledby="planting-date-label" aria-describedby={plantingForm.errors.planted_at ? 'planting-date-error' : 'planting-date-help'}>
                            <h3 id="planting-date-label" className="mb-2 text-sm font-semibold">Planting date</h3>
                            <PlantingCalendar value={plantingForm.data.planted_at} min={activeAssignment.start_date.slice(0, 10)} max={lastPlantingDate} onChange={(date) => { plantingForm.setData('planted_at', date); plantingForm.clearErrors('planted_at'); }} />
                            <p id="planting-date-help" className="mt-2 text-xs leading-5 text-muted-foreground">Selected: {dateLabel(plantingForm.data.planted_at)}. Choose a date from your assignment start through {lastPlantingDate === today ? 'today' : dateLabel(lastPlantingDate)}.</p>
                            {plantingForm.errors.planted_at && <p id="planting-date-error" role="alert" className="mt-2 text-sm text-destructive">{plantingForm.errors.planted_at}</p>}
                        </section>
                        <DialogFooter className="border-t border-border pt-4"><Button type="button" variant="outline" className="rounded-xl" disabled={plantingForm.processing} onClick={() => setPlantingOpen(false)}>Cancel</Button><Button type="submit" className="rounded-xl" disabled={plantingForm.processing}>{plantingForm.processing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sprout aria-hidden="true" />}{plantingForm.processing ? 'Saving…' : 'Add planting'}</Button></DialogFooter>
                    </form>
                </DialogContent>}
            </Dialog>
        </AppLayout>
    );
}

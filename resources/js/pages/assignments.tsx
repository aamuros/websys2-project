import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CropTypeIcon, cropTypes, type CropType } from '@/components/crop-type-icon';
import { PlantingCalendar } from '@/components/planting-calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Field, FilterSelect, FormDialog, Pagination, type Paginated, StatusBadge, Toolbar, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

type Crop = { id: number; name: string; type: CropType };
type Planting = { id: number; planted_at: string; crop: Crop };
type Item = { id: number; status: string; start_date: string; end_date?: string; user: { name: string }; garden_plot: { plot_code: string; location: string }; plantings?: Planting[] };
type Choice = { id: number; name?: string; plot_code?: string };

export default function Assignments({ assignments, members, availablePlots, crops, filters }: { assignments: Paginated<Item>; members: Choice[]; availablePlots: Choice[]; crops: Crop[]; filters: { search?: string; status?: string } }) {
    const role = usePage<SharedPageProps>().props.auth.user!.role;
    const pageUrl = usePage().url;
    const operations = role !== 'member';
    const [mode, setMode] = useState<'new' | 'edit' | 'close' | null>(null);
    const [selected, setSelected] = useState<Item | null>(null);
    const [plantingAssignment, setPlantingAssignment] = useState<Item | null>(() => {
        const requestedId = new URLSearchParams(pageUrl.split('?')[1] ?? '').get('plant');
        return crops.length ? assignments.data.find(item => item.status === 'active' && String(item.id) === requestedId) ?? null : null;
    });
    const [cropFilter, setCropFilter] = useState<CropType | 'all'>('all');
    const visibleCrops = crops.filter(crop => cropFilter === 'all' || crop.type === cropFilter).sort((a, b) => a.name.localeCompare(b.name));
    const form = useForm({ user_id: '', garden_plot_id: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', status: 'ended' });
    const plantingForm = useForm({ crop_id: '', planted_at: new Date().toISOString().slice(0, 10) });
    const open = (nextMode: 'new' | 'edit' | 'close', item?: Item) => {
        setSelected(item ?? null);
        form.setData({ user_id: '', garden_plot_id: '', start_date: item?.start_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), end_date: nextMode === 'close' ? new Date().toISOString().slice(0, 10) : item?.end_date?.slice(0, 10) ?? '', status: 'ended' });
        setMode(nextMode);
    };
    const submit = () => {
        const done = { onSuccess: () => setMode(null) };
        if (mode === 'new') form.post('/assignments', done);
        else if (mode === 'edit' && selected) form.put(`/assignments/${selected.id}`, done);
        else if (mode === 'close' && selected) form.post(`/assignments/${selected.id}/close`, done);
    };

    if (role === 'member') {
        return <><Head title="My assignments" /><AppLayout title="My assignments" description="View your plots and record what you plant." actions={<FilterSelect label="Status" value={filters.status} options={['active', 'ended', 'cancelled'].map(value => [value, value])} onChange={status => router.get('/assignments', { status }, { preserveState: true })} />}>
            {assignments.data.length === 0 ? <Empty message="No plot assignments found." /> : <div className="space-y-4">{assignments.data.map(item => <Card key={item.id} className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-4 border-b p-5"><div><div className="flex items-center gap-3"><h2 className="text-lg font-semibold">Plot {item.garden_plot.plot_code}</h2><StatusBadge value={item.status} /></div><p className="mt-1 text-sm text-muted-foreground">{item.garden_plot.location} · Started {item.start_date.slice(0, 10)}</p></div>{item.status === 'active' && <Button size="sm" disabled={crops.length === 0} onClick={() => { plantingForm.setData({ crop_id: '', planted_at: new Date().toISOString().slice(0, 10) }); plantingForm.clearErrors(); setCropFilter('all'); setPlantingAssignment(item); }}>Add planting</Button>}</div><div className="p-5"><h3 className="mb-3 text-sm font-semibold">Plantings</h3>{item.plantings?.length ? <div className="grid gap-2 sm:grid-cols-2">{item.plantings.map(planting => <div key={planting.id} className="flex items-center gap-3 rounded-xl border bg-background p-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50"><CropTypeIcon type={planting.crop.type} /></span><div><p className="font-medium">{planting.crop.name}</p><p className="text-xs capitalize text-muted-foreground">{planting.crop.type} · Planted {planting.planted_at.slice(0, 10)}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">No plantings recorded for this plot yet.</p>}{item.status === 'active' && crops.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Staff has not added crops yet.</p>}</div></Card>)}</div>}<Pagination page={assignments} />
        </AppLayout><FormDialog open={plantingAssignment !== null} onOpenChange={value => !value && setPlantingAssignment(null)} title="Add planting" description={plantingAssignment ? `Record a crop planted in plot ${plantingAssignment.garden_plot.plot_code}.` : ''} submitLabel="Add planting" processing={plantingForm.processing} onSubmit={() => plantingAssignment && plantingForm.post(`/assignments/${plantingAssignment.id}/plantings`, { onSuccess: () => setPlantingAssignment(null) })} className="max-h-[calc(100dvh-1rem)] max-w-md gap-3 overflow-y-auto p-4 sm:p-5">
            <div role="group" aria-labelledby="planting-crop-label"><p id="planting-crop-label" className="mb-2 text-sm font-medium">Crop</p><div className="mb-2 flex flex-wrap gap-1.5">{(['all', ...cropTypes] as const).map(type => <button key={type} type="button" aria-pressed={cropFilter === type} onClick={() => setCropFilter(type)} className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${cropFilter === type ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-700' : 'bg-card'}`}>{type}</button>)}</div><div className="grid h-44 grid-cols-2 content-start gap-2 overflow-y-auto p-1 sm:grid-cols-4">{visibleCrops.map(crop => { const selected = plantingForm.data.crop_id === String(crop.id); return <button key={crop.id} type="button" aria-pressed={selected} onClick={() => plantingForm.setData('crop_id', String(crop.id))} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${selected ? 'border-2 border-emerald-600 bg-emerald-50' : 'bg-card'}`}><CropTypeIcon type={crop.type} /><span className="text-xs font-medium leading-tight">{crop.name}</span></button>; })}{visibleCrops.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No {cropFilter} crops available.</p>}</div>{plantingForm.errors.crop_id && <p className="mt-1 text-sm text-destructive">{plantingForm.errors.crop_id}</p>}</div>
            <div><p className="mb-2 text-sm font-medium">Planting date</p><PlantingCalendar value={plantingForm.data.planted_at} min={plantingAssignment?.start_date.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} max={new Date().toISOString().slice(0, 10)} onChange={date => plantingForm.setData('planted_at', date)} />{plantingForm.errors.planted_at && <p className="mt-1 text-sm text-destructive">{plantingForm.errors.planted_at}</p>}</div>
        </FormDialog></>;
    }

    return <><Head title="Assignments" /><AppLayout title="Assignments" description="Track active and historical garden plot assignments." actions={<Toolbar path="/assignments" search={filters.search} filters={<FilterSelect label="Status" value={filters.status} options={['active', 'ended', 'cancelled'].map(value => [value, value])} onChange={status => router.get('/assignments', { ...filters, status }, { preserveState: true })} />} actionLabel={operations ? 'New assignment' : undefined} onAction={() => open('new')} />}>
        {assignments.data.length === 0 ? <Empty message="No assignments found." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow>{operations && <TableHead>Member</TableHead>}<TableHead>Plot</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead>{operations && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader><TableBody>{assignments.data.map(item => <TableRow key={item.id}>{operations && <TableCell>{item.user.name}</TableCell>}<TableCell className="font-medium">{item.garden_plot.plot_code}<span className="block text-xs text-muted-foreground">{item.garden_plot.location}</span></TableCell><TableCell>{item.start_date}</TableCell><TableCell>{item.end_date ?? 'Ongoing'}</TableCell><TableCell><StatusBadge value={item.status} /></TableCell>{operations && <TableCell className="space-x-1 text-right">{item.status === 'active' && <><Button size="sm" variant="outline" onClick={() => open('edit', item)}>Edit dates</Button><Button size="sm" onClick={() => open('close', item)}>Close</Button></>}</TableCell>}</TableRow>)}</TableBody></Table><Pagination page={assignments} /></Card>}
    </AppLayout><FormDialog open={mode !== null} onOpenChange={value => !value && setMode(null)} title={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Edit assignment dates' : 'Close assignment'} description={mode === 'new' ? 'Assign an available plot directly to a member.' : mode === 'edit' ? 'Adjust the assignment period.' : 'End or cancel this assignment and release its plot.'} submitLabel={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Save dates' : 'Close assignment'} processing={form.processing} onSubmit={submit}>
        {mode === 'new' && <><Field label="Member" error={form.errors.user_id}><select className={fieldClass} value={form.data.user_id} onChange={event => form.setData('user_id', event.target.value)}><option value="">Select member</option>{members.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Plot" error={form.errors.garden_plot_id}><select className={fieldClass} value={form.data.garden_plot_id} onChange={event => form.setData('garden_plot_id', event.target.value)}><option value="">Select plot</option>{availablePlots.map(item => <option key={item.id} value={item.id}>{item.plot_code}</option>)}</select></Field></>}
        {mode !== 'close' && <Field label="Start date" error={form.errors.start_date}><input type="date" className={fieldClass} value={form.data.start_date} onChange={event => form.setData('start_date', event.target.value)} /></Field>}
        <Field label="End date" error={form.errors.end_date}><input type="date" className={fieldClass} value={form.data.end_date} onChange={event => form.setData('end_date', event.target.value)} /></Field>
        {mode === 'close' && <Field label="Outcome"><select className={fieldClass} value={form.data.status} onChange={event => form.setData('status', event.target.value)}><option value="ended">Ended</option><option value="cancelled">Cancelled</option></select></Field>}
    </FormDialog></>;
}

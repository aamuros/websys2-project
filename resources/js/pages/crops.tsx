import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { CropTypeIcon, cropTypes, type CropType } from '@/components/crop-type-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FormDialog, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';

type Crop = { id: number; name: string; type: CropType; maturity_days_min: number | null; maturity_days_max: number | null; harvest_window_days: number | null; maturity_source: string | null };

export default function Crops({ crops }: { crops: Crop[] }) {
    const [selected, setSelected] = useState<Crop | null>(null);
    const [open, setOpen] = useState(false);
    const [cropFilter, setCropFilter] = useState<CropType | 'all'>('all');
    const visibleCrops = crops.filter(crop => cropFilter === 'all' || crop.type === cropFilter).sort((a, b) => a.name.localeCompare(b.name));
    const emptyForm = { name: '', type: 'vegetable' as CropType, maturity_days_min: '', maturity_days_max: '', harvest_window_days: '', maturity_source: '' };
    const form = useForm(emptyForm);
    const edit = (crop?: Crop) => {
        setSelected(crop ?? null);
        form.setData({
            name: crop?.name ?? '',
            type: crop?.type ?? 'vegetable',
            maturity_days_min: crop?.maturity_days_min?.toString() ?? '',
            maturity_days_max: crop?.maturity_days_max?.toString() ?? '',
            harvest_window_days: crop?.harvest_window_days?.toString() ?? '',
            maturity_source: crop?.maturity_source ?? '',
        });
        form.clearErrors();
        setOpen(true);
    };
    const save = () => {
        const done = { onSuccess: () => setOpen(false) };
        selected ? form.put(`/crops/${selected.id}`, done) : form.post('/crops', done);
    };

    return <><Head title="Crops" /><AppLayout title="Crops" description="Keep the garden's crop list ready for members to plant." actions={<Button onClick={() => edit()}>Add crop</Button>}>
        {crops.length === 0 ? <Card><CardContent className="p-10 text-center"><p className="font-medium">No crops yet</p><p className="mt-1 text-sm text-muted-foreground">Add the first crop to make planting available to members.</p><Button className="mt-5" onClick={() => edit()}>Add crop</Button></CardContent></Card> : <div className="space-y-4"><div className="flex flex-wrap gap-2">{(['all', ...cropTypes] as const).map(type => <button key={type} type="button" aria-pressed={cropFilter === type} onClick={() => setCropFilter(type)} className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${cropFilter === type ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-700' : 'bg-card'}`}>{type}</button>)}</div>{visibleCrops.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No {cropFilter} crops yet.</CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleCrops.map(crop => <Card key={crop.id} className="transition-colors hover:border-emerald-300"><CardContent className="flex items-center gap-4 p-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-50"><CropTypeIcon type={crop.type} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{crop.name}</p><p className="text-sm capitalize text-muted-foreground">{crop.type}</p><p className="mt-1 text-xs text-muted-foreground">{crop.maturity_days_min === null ? 'Harvest timing not configured' : `${crop.maturity_days_min}–${crop.maturity_days_max} days to harvest`}</p></div><Button size="sm" variant="outline" onClick={() => edit(crop)}>Edit</Button></CardContent></Card>)}</div>}</div>}
    </AppLayout><FormDialog open={open} onOpenChange={setOpen} title={selected ? 'Edit crop' : 'Add crop'} description="Give this crop a name and type." submitLabel={selected ? 'Save changes' : 'Add crop'} processing={form.processing} onSubmit={save}>
        <Field label="Crop name" error={form.errors.name}><input className={fieldClass} value={form.data.name} onChange={event => form.setData('name', event.target.value)} placeholder="Example: Tomato" /></Field>
        <div role="group" aria-labelledby="crop-type-label"><p id="crop-type-label" className="mb-2 text-sm font-medium">Type</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{cropTypes.map(type => <button key={type} type="button" aria-pressed={form.data.type === type} onClick={() => form.setData('type', type)} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center text-xs font-medium capitalize transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${form.data.type === type ? 'border-2 border-emerald-600 bg-emerald-50' : 'bg-card'}`}><CropTypeIcon type={type} />{type}</button>)}</div>{form.errors.type && <p className="mt-1 text-sm text-destructive">{form.errors.type}</p>}</div>
        <div className="rounded-xl border p-3"><p className="text-sm font-medium">Harvest estimate (optional)</p><p className="mt-1 text-xs text-muted-foreground">Enter days from the recorded planting date. Leave both day fields blank to disable estimates for this crop.</p><div className="mt-3 grid grid-cols-2 gap-3"><Field label="Earliest days" error={form.errors.maturity_days_min}><input type="number" min="1" max="3650" className={fieldClass} value={form.data.maturity_days_min} onChange={event => form.setData('maturity_days_min', event.target.value)} placeholder="60" /></Field><Field label="Latest days" error={form.errors.maturity_days_max}><input type="number" min="1" max="3650" className={fieldClass} value={form.data.maturity_days_max} onChange={event => form.setData('maturity_days_max', event.target.value)} placeholder="75" /></Field></div><Field label="Harvest duration (days, optional)" error={form.errors.harvest_window_days}><input type="number" min="0" max="3650" className={fieldClass} value={form.data.harvest_window_days} onChange={event => form.setData('harvest_window_days', event.target.value)} placeholder="Leave blank if unknown" /></Field><Field label="Timing source / date basis" error={form.errors.maturity_source}><input className={fieldClass} maxLength={255} value={form.data.maturity_source} onChange={event => form.setData('maturity_source', event.target.value)} placeholder="Seed packet, variety; days from direct sowing" /></Field>{(form.errors.maturity_days_min || form.errors.maturity_days_max) && <p className="text-sm text-destructive">{form.errors.maturity_days_min || form.errors.maturity_days_max}</p>}</div>
    </FormDialog></>;
}

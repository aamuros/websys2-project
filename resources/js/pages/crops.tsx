import { Head, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CropTypeIcon, cropTypes, type CropType } from '@/components/crop-type-icon';
import { Button } from '@/components/ui/button';
import { Empty, Field, FormDialog, WorkspacePanel, WorkspaceSection, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Crop = { id: number; name: string; type: CropType };

export default function Crops({ crops }: { crops: Crop[] }) {
    const [selected, setSelected] = useState<Crop | null>(null);
    const [open, setOpen] = useState(false);
    const [cropFilter, setCropFilter] = useState<CropType | 'all'>('all');
    const visibleCrops = crops.filter(crop => cropFilter === 'all' || crop.type === cropFilter).sort((a, b) => a.name.localeCompare(b.name));
    const form = useForm({ name: '', type: 'vegetable' as CropType });
    const edit = (crop?: Crop) => {
        setSelected(crop ?? null);
        form.setData({ name: crop?.name ?? '', type: crop?.type ?? 'vegetable' });
        form.clearErrors();
        setOpen(true);
    };
    const save = () => {
        const done = { onSuccess: () => setOpen(false) };
        selected ? form.put(`/crops/${selected.id}`, done) : form.post('/crops', done);
    };

    return <><Head title="Crops" /><AppLayout title="Crops" description="Keep the garden's crop list ready for members to plant." actions={<Button className="w-full sm:w-auto" onClick={() => edit()}><Plus aria-hidden="true" />Add crop</Button>}>
        <div className="space-y-8 pb-9">
            <WorkspaceSection title="Crop directory" description={`${visibleCrops.length} ${visibleCrops.length === 1 ? 'crop' : 'crops'} available in this view.`}>
                {crops.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/55 p-5 sm:p-6">
                        <p className="text-sm font-bold">No crops yet</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">Add the first crop to make planting available to members.</p>
                        <Button className="mt-4 w-full sm:w-auto" onClick={() => edit()}><Plus aria-hidden="true" />Add crop</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter crops by type">
                            {(['all', ...cropTypes] as const).map(type => (
                                <button key={type} type="button" aria-pressed={cropFilter === type} onClick={() => setCropFilter(type)} className={cn('h-9 rounded-full px-3 text-[13px] font-medium capitalize text-muted-foreground transition-colors hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', cropFilter === type && 'bg-primary/[0.09] font-semibold text-foreground')}>
                                    {type === 'all' ? 'All crops' : type}
                                </button>
                            ))}
                        </div>
                        {visibleCrops.length === 0 ? <Empty message={`No ${cropFilter} crops yet.`} /> : (
                            <WorkspacePanel>
                                <ul className="divide-y divide-border">
                                    {visibleCrops.map(crop => (
                                        <li key={crop.id} className="flex items-center gap-3.5 p-5 transition-colors hover:bg-muted/45 sm:p-6">
                                            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><CropTypeIcon type={crop.type} /></span>
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-sm font-bold">{crop.name}</p>
                                                <p className="mt-1 text-xs capitalize text-muted-foreground">{crop.type}</p>
                                            </div>
                                            <Button size="sm" variant="outline" aria-label={`Edit crop: ${crop.name}`} onClick={() => edit(crop)}>Edit</Button>
                                        </li>
                                    ))}
                                </ul>
                            </WorkspacePanel>
                        )}
                    </div>
                )}
            </WorkspaceSection>
        </div>
    </AppLayout><FormDialog open={open} onOpenChange={setOpen} title={selected ? 'Edit crop' : 'Add crop'} description="Give this crop a name and type." submitLabel={selected ? 'Save changes' : 'Add crop'} processing={form.processing} onSubmit={save}>
        <Field label="Crop name" error={form.errors.name}><input className={fieldClass} value={form.data.name} onChange={event => form.setData('name', event.target.value)} placeholder="Example: Tomato" /></Field>
        <div role="group" aria-labelledby="crop-type-label"><p id="crop-type-label" className="mb-2 text-sm font-medium">Type</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{cropTypes.map(type => <button key={type} type="button" aria-pressed={form.data.type === type} onClick={() => form.setData('type', type)} className={cn('flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-border p-2 text-center text-xs font-medium capitalize transition-colors hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', form.data.type === type ? 'border-primary/50 bg-primary/[0.09]' : 'bg-card')}><CropTypeIcon type={type} />{type}</button>)}</div>{form.errors.type && <p className="mt-1 text-sm text-destructive">{form.errors.type}</p>}</div>
    </FormDialog></>;
}

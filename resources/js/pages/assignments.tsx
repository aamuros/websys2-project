import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Field, FilterSelect, FormDialog, Pagination, type Paginated, StatusBadge, Toolbar, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

type Item = { id: number; status: string; start_date: string; end_date?: string; user: { name: string }; garden_plot: { plot_code: string; location: string } };
type Choice = { id: number; name?: string; plot_code?: string };

export default function Assignments({ assignments, members, availablePlots, filters }: { assignments: Paginated<Item>; members: Choice[]; availablePlots: Choice[]; filters: { search?: string; status?: string } }) {
    const role = usePage<SharedPageProps>().props.auth.user!.role;
    const operations = role !== 'member';
    const [mode, setMode] = useState<'new' | 'edit' | 'close' | null>(null);
    const [selected, setSelected] = useState<Item | null>(null);
    const form = useForm({ user_id: '', garden_plot_id: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', status: 'ended' });
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

    return <><Head title={role === 'member' ? 'My assignments' : 'Assignments'} /><AppLayout title={role === 'member' ? 'My assignments' : 'Assignments'} description="Track active and historical garden plot assignments." actions={<Toolbar path="/assignments" search={filters.search} filters={<FilterSelect label="Status" value={filters.status} options={['active', 'ended', 'cancelled'].map(value => [value, value])} onChange={status => router.get('/assignments', { ...filters, status }, { preserveState: true })} />} actionLabel={operations ? 'New assignment' : undefined} onAction={() => open('new')} />}>
        {assignments.data.length === 0 ? <Empty message="No assignments found." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow>{operations && <TableHead>Member</TableHead>}<TableHead>Plot</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead>{operations && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader><TableBody>{assignments.data.map(item => <TableRow key={item.id}>{operations && <TableCell>{item.user.name}</TableCell>}<TableCell className="font-medium">{item.garden_plot.plot_code}<span className="block text-xs text-muted-foreground">{item.garden_plot.location}</span></TableCell><TableCell>{item.start_date}</TableCell><TableCell>{item.end_date ?? 'Ongoing'}</TableCell><TableCell><StatusBadge value={item.status} /></TableCell>{operations && <TableCell className="space-x-1 text-right">{item.status === 'active' && <><Button size="sm" variant="outline" onClick={() => open('edit', item)}>Edit dates</Button><Button size="sm" onClick={() => open('close', item)}>Close</Button></>}</TableCell>}</TableRow>)}</TableBody></Table><Pagination page={assignments} /></Card>}
    </AppLayout><FormDialog open={mode !== null} onOpenChange={value => !value && setMode(null)} title={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Edit assignment dates' : 'Close assignment'} description={mode === 'new' ? 'Assign an available plot directly to a member.' : mode === 'edit' ? 'Adjust the assignment period.' : 'End or cancel this assignment and release its plot.'} submitLabel={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Save dates' : 'Close assignment'} processing={form.processing} onSubmit={submit}>
        {mode === 'new' && <><Field label="Member" error={form.errors.user_id}><select className={fieldClass} value={form.data.user_id} onChange={event => form.setData('user_id', event.target.value)}><option value="">Select member</option>{members.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Plot" error={form.errors.garden_plot_id}><select className={fieldClass} value={form.data.garden_plot_id} onChange={event => form.setData('garden_plot_id', event.target.value)}><option value="">Select plot</option>{availablePlots.map(item => <option key={item.id} value={item.id}>{item.plot_code}</option>)}</select></Field></>}
        {mode !== 'close' && <Field label="Start date" error={form.errors.start_date}><input type="date" className={fieldClass} value={form.data.start_date} onChange={event => form.setData('start_date', event.target.value)} /></Field>}
        <Field label="End date" error={form.errors.end_date}><input type="date" className={fieldClass} value={form.data.end_date} onChange={event => form.setData('end_date', event.target.value)} /></Field>
        {mode === 'close' && <Field label="Outcome"><select className={fieldClass} value={form.data.status} onChange={event => form.setData('status', event.target.value)}><option value="ended">Ended</option><option value="cancelled">Cancelled</option></select></Field>}
    </FormDialog></>;
}

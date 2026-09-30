import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Field, FilterSelect, FormDialog, Pagination, type Paginated, StatusBadge, Toolbar, WorkspacePanel, WorkspaceSection, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';

type Member = {
    id: number;
    name: string;
    email: string;
    role: 'member' | 'staff';
    is_active: boolean;
    plot_requests_count: number;
    plot_assignments_count: number;
};

export default function Members({ members, filters }: {
    members: Paginated<Member>;
    filters: { search?: string; role?: string; status?: string };
}) {
    const [selected, setSelected] = useState<Member | null>(null);
    const form = useForm({ role: 'member', is_active: true });
    function edit(member: Member) {
        form.clearErrors();
        setSelected(member);
        form.setData({ role: member.role, is_active: member.is_active });
    }

    return (
        <>
            <Head title="Members" />
            <AppLayout title="Members" description="Manage community access and operational roles." actions={<Toolbar path="/members" search={filters.search} />}>
                <div className="space-y-8 pb-9">
                    <WorkspaceSection
                        title="Member directory"
                        description={`${members.total} accounts matching the current filters.`}
                        actions={(
                            <div className="flex flex-wrap items-center gap-2">
                                <FilterSelect label="Role" value={filters.role} options={[["member", "Member"], ["staff", "Staff"]]} onChange={role => router.get('/members', { ...filters, role }, { preserveState: true })} />
                                <FilterSelect label="Status" value={filters.status} options={[["active", "Active"], ["suspended", "Suspended"]]} onChange={status => router.get('/members', { ...filters, status }, { preserveState: true })} />
                            </div>
                        )}
                    >
                        {members.data.length === 0 ? <Empty message="No members found." /> : (
                            <WorkspacePanel>
                                <Table aria-label="Member directory">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Person</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Requests</TableHead>
                                            <TableHead className="text-right">Assignments</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.data.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell className="min-w-52">
                                                    <p className="font-bold">{member.name}</p>
                                                    <p className="mt-1 break-all text-xs text-muted-foreground">{member.email}</p>
                                                </TableCell>
                                                <TableCell className="capitalize">{member.role}</TableCell>
                                                <TableCell><StatusBadge value={member.is_active ? 'active' : 'suspended'} /></TableCell>
                                                <TableCell className="text-right tabular-nums">{member.plot_requests_count}</TableCell>
                                                <TableCell className="text-right tabular-nums">{member.plot_assignments_count}</TableCell>
                                                <TableCell className="text-right"><Button size="sm" variant="outline" aria-label={`Manage account for ${member.name}`} onClick={() => edit(member)}>Manage</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination page={members} />
                            </WorkspacePanel>
                        )}
                    </WorkspaceSection>
                </div>
            </AppLayout>
            <FormDialog open={!!selected} onOpenChange={value => !value && setSelected(null)} title="Manage account" description={selected ? `Update access for ${selected.name}.` : ''} processing={form.processing} onSubmit={() => selected && form.put(`/members/${selected.id}`, { onSuccess: () => setSelected(null) })}>
                <Field label="Role" error={form.errors.role}><select className={fieldClass} value={form.data.role} onChange={event => form.setData('role', event.target.value)}><option value="member">Member</option><option value="staff">Staff</option></select></Field>
                <Field label="Account status" error={form.errors.is_active}>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={form.data.is_active} onChange={event => form.setData('is_active', event.target.checked)} />Account is active</div>
                </Field>
            </FormDialog>
        </>
    );
}

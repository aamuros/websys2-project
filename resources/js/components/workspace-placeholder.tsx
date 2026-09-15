import { Head } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppLayout } from '@/layouts/app-layout';
import type { UserRole } from '@/types';

const roleContent: Record<UserRole, { title: string; description: string; focus: string; capabilities: string[] }> = {
    member: {
        title: 'Member dashboard',
        description: 'Track your future plot requests and assignments from one personal workspace.',
        focus: 'Member self-service foundation',
        capabilities: ['Request a garden plot', 'Review assignment dates', 'Keep membership details current'],
    },
    staff: {
        title: 'Staff dashboard',
        description: 'A focused operations area for reviewing requests and coordinating garden plots.',
        focus: 'Daily garden operations foundation',
        capabilities: ['Review incoming requests', 'Maintain plot availability', 'Coordinate active assignments'],
    },
    admin: {
        title: 'Admin dashboard',
        description: 'System oversight for users, access roles, and garden operations.',
        focus: 'Administration foundation',
        capabilities: ['Manage user access', 'Oversee all garden records', 'Review operational activity'],
    },
};

export function WorkspacePlaceholder({ role }: { role: UserRole }) {
    const content = roleContent[role];

    return (
        <AppLayout title={content.title} description={content.description}>
            <Head title={content.title} />
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section>
                    <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold">Workspace scope</h2><p className="mt-1 text-sm text-muted-foreground">Prepared now; workflows arrive in later feature branches.</p></div><Badge variant="outline">Scaffold</Badge></div>
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <Table>
                            <TableHeader><TableRow><TableHead>Capability</TableHead><TableHead className="w-36">Status</TableHead></TableRow></TableHeader>
                            <TableBody>{content.capabilities.map((capability) => <TableRow key={capability}><TableCell className="font-medium">{capability}</TableCell><TableCell><span className="inline-flex items-center gap-2 text-muted-foreground"><Clock3 className="size-3.5" />Planned</span></TableCell></TableRow>)}</TableBody>
                        </Table>
                    </div>
                </section>
                <aside className="border-l-0 xl:border-l xl:pl-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current focus</p>
                    <p className="mt-3 text-lg font-semibold leading-snug">{content.focus}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">Authentication, role protection, database models, and the shared application shell are ready for feature work.</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 className="size-4" />Access boundary active</div>
                </aside>
            </div>
            <Alert className="mt-8 border-primary/20 bg-secondary/45">
                <ArrowRight />
                <AlertTitle>Ready for the next feature branch</AlertTitle>
                <AlertDescription>No plot CRUD actions are enabled in this scaffold.</AlertDescription>
            </Alert>
        </AppLayout>
    );
}

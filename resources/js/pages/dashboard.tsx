import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Database, LockKeyhole, PanelsTopLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

const foundations = [
    { name: 'Authentication', detail: 'Laravel sessions, CSRF, hashing', icon: LockKeyhole, state: 'Ready' },
    { name: 'Data layer', detail: 'Eloquent models on PostgreSQL', icon: Database, state: 'Ready' },
    { name: 'Application shell', detail: 'React, Inertia, Tailwind, shadcn/ui', icon: PanelsTopLeft, state: 'Ready' },
];

export default function Dashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user!;

    return (
        <AppLayout
            title={`Good day, ${user.name.split(' ')[0]}`}
            description="Your account is connected to the community garden workspace. Use the role workspace for the tools assigned to you."
            actions={<Button asChild><Link href={`/${user.role}/dashboard`}>Open {user.role} workspace<ArrowUpRight /></Link></Button>}
        >
            <Head title="Dashboard" />
            <section>
                <div className="mb-5"><h2 className="text-base font-semibold">Foundation status</h2><p className="mt-1 text-sm text-muted-foreground">Core systems available to every future feature.</p></div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    <Table>
                        <TableHeader><TableRow><TableHead>System</TableHead><TableHead>Implementation</TableHead><TableHead className="w-28">Status</TableHead></TableRow></TableHeader>
                        <TableBody>{foundations.map(({ name, detail, icon: Icon, state }) => <TableRow key={name}><TableCell><span className="flex items-center gap-3 font-medium"><span className="grid size-8 place-items-center rounded-md bg-secondary text-primary"><Icon className="size-4" /></span>{name}</span></TableCell><TableCell className="text-muted-foreground">{detail}</TableCell><TableCell><Badge variant="secondary">{state}</Badge></TableCell></TableRow>)}</TableBody>
                    </Table>
                </div>
            </section>
            <section className="mt-10 grid gap-6 border-t pt-8 md:grid-cols-3">
                <div><p className="text-3xl font-semibold tracking-tight">3</p><p className="mt-1 text-sm text-muted-foreground">protected role areas</p></div>
                <div><p className="text-3xl font-semibold tracking-tight">4</p><p className="mt-1 text-sm text-muted-foreground">foundational data tables</p></div>
                <div><p className="text-3xl font-semibold tracking-tight">1</p><p className="mt-1 text-sm text-muted-foreground">unified Laravel application</p></div>
            </section>
        </AppLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/layouts/app-layout';

export default function AdminDashboard({ metrics }: { metrics: Record<string, number> }) {
    return <><Head title="Admin dashboard" /><AppLayout title="Admin dashboard" description="Manage accounts and review garden activity." actions={<Button asChild><Link href="/reports">View reports</Link></Button>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(metrics).map(([key, value]) => <Card key={key}><CardHeader className="pb-2"><CardTitle className="text-sm capitalize text-muted-foreground">{key}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{value}</CardContent></Card>)}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Card><CardHeader><CardTitle>Members and roles</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Manage account access and staff roles.</p><Button asChild variant="outline"><Link href="/members">Manage members</Link></Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Community updates</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Share important news with the garden community.</p><Button asChild variant="outline"><Link href="/community-updates">View updates</Link></Button></CardContent></Card>
        </div>
    </AppLayout></>;
}

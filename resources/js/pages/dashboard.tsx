import { Head, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user!.name.split(' ')[0];

    return (
        <>
            <Head title="Dashboard" />
            <AppLayout
                title={`Good day, ${firstName}`}
                description="Your community garden workspace is ready for you."
            />
        </>
    );
}

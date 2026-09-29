import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';

export default function Settings() {
    return (
        <>
            <Head title="Settings" />
            <AppLayout title="Settings" description="Manage your profile and account security." />
        </>
    );
}

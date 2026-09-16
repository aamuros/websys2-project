import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';

export default function WorkspacePage({ title, description }: { title: string; description: string }) {
    return (
        <>
            <Head title={title} />
            <AppLayout title={title} description={description} />
        </>
    );
}

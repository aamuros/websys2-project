import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import type { UserRole } from '@/types';

const roleContent: Record<UserRole, { title: string; description: string }> = {
    member: {
        title: 'Member dashboard',
        description: 'Track your plot requests and assignments from one personal workspace.',
    },
    staff: {
        title: 'Staff dashboard',
        description: 'Review requests and coordinate community garden plots.',
    },
    admin: {
        title: 'Admin dashboard',
        description: 'Manage users, access roles, and garden operations.',
    },
};

export function WorkspacePlaceholder({ role }: { role: UserRole }) {
    const content = roleContent[role];

    return (
        <>
            <Head title={content.title} />
            <AppLayout title={content.title} description={content.description} />
        </>
    );
}

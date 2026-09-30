import { Head } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '@/layouts/auth-layout';

export function AuthPanel({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
    return <AuthLayout>
        <Head title={title} />
        <Card className="animate-rise-in border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6"><CardTitle className="text-2xl">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
            <CardContent className="space-y-5 px-0 sm:px-6">{children}</CardContent>
        </Card>
    </AuthLayout>;
}
